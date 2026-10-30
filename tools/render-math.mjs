// stdin: JSON array of TeX strings (display math)
// stdout: JSON array of KaTeX HTML strings, in the same order
import katex from "katex";

let input = "";
process.stdin.setEncoding("utf8");
process.stdin.on("data", (chunk) => (input += chunk));
process.stdin.on("end", () => {
  const items = JSON.parse(input);
  const out = items.map((tex) =>
    katex.renderToString(tex, {
      displayMode: true,
      throwOnError: true,
      strict: "ignore", // 日本語の \text{…} を許可する
      output: "html",
    })
  );
  process.stdout.write(JSON.stringify(out));
});
