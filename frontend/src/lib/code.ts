/**
 * Processes code blocks in markdown content to handle file updates
 * @param content - The markdown content containing code blocks
 * @param partial - Whether the content is partial/incomplete
 * @returns The processed content with encoded file updates
 */
export const fixCodeBlocks = (content: string, partial: boolean): string => {
    if (!content) return content;
  
    const replaceB64 = (_match: string, filename: string, content: string): string => {
      const b64 = Buffer.from(JSON.stringify({ filename, content })).toString(
        'base64'
      );
      return `<file-update>${b64}</file-update>`;
    };
  
    content = content.replace(
      /```[\w.]+\n[#/]+ (\S+)\n([\s\S]+?)```/g,
      replaceB64
    );
    content = content.replace(
      /```[\w.]+\n[/*]+ (\S+) \*\/\n([\s\S]+?)```/g,
      replaceB64
    );
    content = content.replace(
      /```[\w.]+\n<!-- (\S+) -->\n([\s\S]+?)```/g,
      replaceB64
    );
  
    if (partial) {
      content = content.replace(
        /```[\s\S]+$/,
        '<file-loading>...</file-loading>'
      );
    }
  
    return content;
  };