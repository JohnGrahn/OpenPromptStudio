from abc import ABC, abstractmethod
from typing import Dict, Any, List, AsyncGenerator, Callable, Type
from pydantic import BaseModel
import json
import base64
import httpx
from google.generativeai import GenerativeModel
import google.generativeai as genai
from config import GEMINI_API_KEY, DEEPSEEK_API_KEY


class AgentTool(BaseModel):
    name: str
    description: str
    parameters: Dict[str, Any]
    func: Callable

    def to_gemini_tool(self):
        return {
            "function_declarations": [{
                "name": self.name,
                "description": self.description,
                "parameters": self.parameters,
            }]
        }

    def to_deepseek_tool(self):
        return {
            "type": "function",
            "function": {
                "name": self.name,
                "description": self.description,
                "parameters": self.parameters,
            },
        }


class LLMProvider(ABC):
    @abstractmethod
    async def chat_complete(
        self, system_prompt: str, user_prompt: str, model: str, temperature: float = 0.0
    ) -> str:
        pass

    @abstractmethod
    async def chat_complete_with_tools(
        self,
        messages: List[Dict[str, Any]],
        tools: List[AgentTool],
        model: str,
        temperature: float = 0.0,
    ) -> AsyncGenerator[Dict[str, Any], None]:
        pass


class GeminiLLMProvider(LLMProvider):
    def __init__(self):
        genai.configure(api_key=GEMINI_API_KEY)
        self.client = GenerativeModel('gemini-pro')

    async def chat_complete(
        self, system_prompt: str, user_prompt: str, model: str, temperature: float = 0.0
    ) -> str:
        combined_prompt = f"{system_prompt}\n\n{user_prompt}"
        response = await self.client.generate_content_async(
            combined_prompt,
            generation_config={"temperature": temperature}
        )
        return response.text

    async def _handle_tool_call(self, tools: List[AgentTool], tool_call) -> str:
        tool_name = tool_call.get("name")
        arguments = tool_call.get("args", {})

        tool = next((tool for tool in tools if tool.name == tool_name), None)
        if not tool:
            raise ValueError(f"Unknown tool: {tool_name}")
        return await tool.func(**arguments)

    async def chat_complete_with_tools(
        self,
        messages: List[Dict[str, Any]],
        tools: List[AgentTool],
        model: str,
        temperature: float = 0.0,
    ) -> AsyncGenerator[Dict[str, Any], None]:
        chat = self.client.start_chat()
        
        for message in messages:
            if message["role"] == "user":
                response = await chat.send_message_async(
                    message["content"],
                    generation_config={"temperature": temperature},
                    tools=[tool.to_gemini_tool() for tool in tools] if tools else None
                )
                
                if response.candidates[0].content.parts[0].function_call:
                    tool_call = response.candidates[0].content.parts[0].function_call
                    yield {"type": "tool_calls", "tool_calls": [tool_call]}
                    
                    tool_result = await self._handle_tool_call(tools, tool_call)
                    await chat.send_message_async(f"Tool response: {tool_result}")
                else:
                    yield {"type": "content", "content": response.text}


class DeepseekLLMProvider(LLMProvider):
    def __init__(self):
        self.client = httpx.AsyncClient()
        self.api_key = DEEPSEEK_API_KEY
        self.api_base = "https://api.deepseek.com/v1"

    async def chat_complete(
        self, system_prompt: str, user_prompt: str, model: str, temperature: float = 0.0
    ) -> str:
        response = await self.client.post(
            f"{self.api_base}/chat/completions",
            headers={"Authorization": f"Bearer {self.api_key}"},
            json={
                "model": model,
                "messages": [
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": user_prompt}
                ],
                "temperature": temperature
            }
        )
        return response.json()["choices"][0]["message"]["content"]

    async def _handle_tool_call(self, tools: List[AgentTool], tool_call) -> str:
        tool_name = tool_call["function"]["name"]
        arguments = json.loads(tool_call["function"]["arguments"])

        tool = next((tool for tool in tools if tool.name == tool_name), None)
        if not tool:
            raise ValueError(f"Unknown tool: {tool_name}")
        return await tool.func(**arguments)

    async def chat_complete_with_tools(
        self,
        messages: List[Dict[str, Any]],
        tools: List[AgentTool],
        model: str,
        temperature: float = 0.0,
    ) -> AsyncGenerator[Dict[str, Any], None]:
        current_messages = messages.copy()

        while True:
            response = await self.client.post(
                f"{self.api_base}/chat/completions",
                headers={"Authorization": f"Bearer {self.api_key}"},
                json={
                    "model": model,
                    "messages": current_messages,
                    "temperature": temperature,
                    "tools": [tool.to_deepseek_tool() for tool in tools] if tools else None,
                    "stream": True
                }
            )

            async for line in response.aiter_lines():
                if not line.strip():
                    continue
                    
                chunk = json.loads(line)
                if chunk.get("choices")[0].get("delta").get("tool_calls"):
                    tool_calls = chunk["choices"][0]["delta"]["tool_calls"]
                    yield {"type": "tool_calls", "tool_calls": tool_calls}
                    
                    for tool_call in tool_calls:
                        tool_result = await self._handle_tool_call(tools, tool_call)
                        current_messages.append({
                            "role": "assistant",
                            "content": None,
                            "tool_calls": tool_calls
                        })
                        current_messages.append({
                            "role": "tool",
                            "content": tool_result,
                            "name": tool_call["function"]["name"]
                        })
                elif chunk.get("choices")[0].get("delta").get("content"):
                    yield {
                        "type": "content",
                        "content": chunk["choices"][0]["delta"]["content"]
                    }

                if chunk["choices"][0].get("finish_reason") == "stop":
                    return


LLM_PROVIDERS: Dict[str, Type[LLMProvider]] = {
    "gemini": GeminiLLMProvider,
    "deepseek": DeepseekLLMProvider,
}