/**
 * 从 SKILL.md 内容中解析 YAML frontmatter（name, description）
 * 支持单行和多行（| 或 >）格式
 */
export function parseSkillMdFrontmatter(content: string): { name: string; description: string } {
  const match = content.match(/^---\s*\n([\s\S]*?)\n---/);
  const name = "未命名技能";
  const description = "";
  if (!match) return { name, description };
  const yaml = match[1];
  let parsedName = name;
  let parsedDesc = description;

  const lines = yaml.split("\n");
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];

    // 解析 name
    const nameMatch = line.match(/^name\s*:\s*(.+)$/);
    if (nameMatch) {
      parsedName = nameMatch[1].trim().replace(/^["']|["']$/g, "");
      i++;
      continue;
    }

    // 解析 description（支持单行和多行）
    const descMatch = line.match(/^description\s*:\s*(.*)$/);
    if (descMatch) {
      const firstLine = descMatch[1].trim();

      // 多行格式：description: | 或 description: >
      if (firstLine === '|' || firstLine === '>') {
        const multilineDesc: string[] = [];
        i++;

        // 读取缩进的后续行
        while (i < lines.length) {
          const nextLine = lines[i];
          // 如果是缩进行（以空格或tab开头），则是描述的一部分
          if (nextLine.match(/^[ \t]+\S/)) {
            multilineDesc.push(nextLine.replace(/^[ \t]+/, ''));
            i++;
          } else if (nextLine.trim() === '') {
            // 空行也算多行描述的一部分
            multilineDesc.push('');
            i++;
          } else {
            // 遇到非缩进行，多行描述结束
            break;
          }
        }
        parsedDesc = multilineDesc.join(' ').trim();
      } else {
        // 单行格式：description: some text
        parsedDesc = firstLine.replace(/^["']|["']$/g, "");
        i++;
      }
      continue;
    }

    i++;
  }

  return { name: parsedName || name, description: parsedDesc || description };
}
