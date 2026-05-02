// ─── Inline markdown ─────────────────────────────────────────────────────────

export function inlineMarkdown(text) {
  return text
    .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
    .replace(/\*(.+?)\*/g,     "<em>$1</em>")
    .replace(/`(.+?)`/g,       "<code>$1</code>")
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2">$1</a>');
}

// ─── Table parser ─────────────────────────────────────────────────────────────

function isSeparatorRow(line) {
  return /^\|[\s\-:|]+\|$/.test(line.trim());
}

function isTableRow(line) {
  return /^\|.+\|$/.test(line.trim());
}

function parseTableRow(line) {
  return line.trim()
    .replace(/^\|/, "")
    .replace(/\|$/, "")
    .split("|")
    .map((cell) => cell.trim());
}

function buildTable(lines) {
  const rows = lines.filter((l) => !isSeparatorRow(l));
  if (rows.length === 0) return "";

  const [headerRow, ...bodyRows] = rows;
  const headers = parseTableRow(headerRow);

  const isMetaTable = headers.every((h) => h === "");

  const thead = isMetaTable ? "" :
    `<thead><tr>${headers.map((h) => `<th>${inlineMarkdown(h)}</th>`).join("")}</tr></thead>`;

  const tbody = bodyRows.map((row) => {
    const cells = parseTableRow(row);
    const tag = isMetaTable ? "th" : "td";
    return `<tr>${cells.map((c, i) =>
      i === 0 && isMetaTable
        ? `<th>${inlineMarkdown(c)}</th>`
        : `<td>${inlineMarkdown(c)}</td>`
    ).join("")}</tr>`;
  }).join("");

  return `<table>${thead}<tbody>${tbody}</tbody></table>`;
}

// ─── Block parser ─────────────────────────────────────────────────────────────

export function parseMarkdown(raw) {
  const lines = raw.split("\n");
  const blocks = [];
  let tableBuffer = [];

  const flushTable = () => {
    if (tableBuffer.length > 0) {
      blocks.push({ type: "table", lines: [...tableBuffer] });
      tableBuffer = [];
    }
  };

  for (const line of lines) {
    if (isTableRow(line) || isSeparatorRow(line)) {
      tableBuffer.push(line);
    } else {
      flushTable();
      blocks.push({ type: "line", line });
    }
  }
  flushTable();

  const rendered = blocks.map(({ type, lines: tLines, line }) => {
    if (type === "table") return { tag: "html", html: buildTable(tLines) };

    if (/^### /.test(line))          return { tag: "html", html: `<h3>${inlineMarkdown(line.slice(4))}</h3>` };
    if (/^## /.test(line))           return { tag: "html", html: `<h2>${inlineMarkdown(line.slice(3))}</h2>` };
    if (/^# /.test(line))            return { tag: "html", html: `<h1>${inlineMarkdown(line.slice(2))}</h1>` };
    if (/^---+$/.test(line.trim()))  return { tag: "html", html: "<hr />" };
    if (/^\s*[-*] /.test(line))      return { tag: "li", html: inlineMarkdown(line.replace(/^\s*[-*] /, "")) };
    if (/^\d+\. /.test(line))        return { tag: "li", html: inlineMarkdown(line.replace(/^\d+\. /, "")) };
    if (line.trim() === "")          return { tag: "html", html: "<br />" };
    return { tag: "html", html: `<p>${inlineMarkdown(line)}</p>` };
  });

  const output = [];
  let i = 0;
  while (i < rendered.length) {
    if (rendered[i].tag === "li") {
      const items = [];
      while (i < rendered.length && rendered[i].tag === "li") {
        items.push(rendered[i].html);
        i++;
      }
      const isToc = items.every((h) => /<a\s[^>]*href="#/.test(h));
      const cls = isToc ? ' class="toc"' : "";
      output.push(`<ul${cls}>${items.map((h) => `<li>${h}</li>`).join("")}</ul>`);
    } else {
      output.push(rendered[i].html);
      i++;
    }
  }
  return output.join("");
}
