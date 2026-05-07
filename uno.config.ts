import {
  defineConfig,
  presetAttributify,
  presetIcons,
  presetWind,
} from "unocss";

export default defineConfig({
  shortcuts: [
    {
      // 按钮基础样式
      btn: "px-4 py-2 rounded-md inline-block font-medium text-sm",
      "btn-primary": "btn bg-indigo-600 text-white hover:bg-indigo-700",
      "btn-secondary": "btn bg-gray-100 text-gray-700 hover:bg-gray-200",
      "btn-danger": "btn bg-red-600 text-white hover:bg-red-700",

      // 布局组件
      "flex-center": "flex items-center justify-center",
      "grid-basic": "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4",

      // 卡片系列
      card: "bg-white rounded-lg shadow-sm p-4",
      "dashboard-card": "bg-white rounded-lg shadow-sm p-6",

      // 侧边栏
      "sidebar-item":
        "flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium text-gray-400 hover:text-white hover:bg-white/10 transition-colors duration-150",
      "sidebar-item-active":
        "flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium bg-indigo-600 text-white",
    },
    [/^i-ad:(.*)$/, (p) => `i-ant-design:${p[1]}`],
    [/^i-c:(.*)$/, (p) => `i-carbon:${p[1]}`],
    [/^i-mat:(.*)$/, (p) => `i-material-symbols:${p[1]}`],
    [/^i-tw:(.*)$/, (p) => `i-tabler:${p[1]}`],
    [/^i-vsc:(.*)$/, (p) => `i-vscode-icons:${p[1]}`],
    [/^i-im:(.*)$/, (p) => `i-icomoon:${p[1]}`],
    [/^i-if:(.*)$/, (p) => `i-icofont:${p[1]}`],
  ],
  content: {
    pipeline: {
      include: [
        /\.(vue|svelte|[jt]sx|mdx?|astro|elm|php|phtml|html)($|\?)/,
        "src/**.icon.json",
        "src/frames/menus.json",
      ],
    },
  },
  presets: [
    presetWind(),
    presetAttributify({
      /* preset options */
    }),
    presetIcons({
      scale: 1.25,
      autoInstall: false,
      extraProperties: {
        display: "inline-block",
        "vertical-align": "text-bottom",
      },
      processor(css, meta) {
        console.log("meta:", meta);
        console.log("css:", css);
        return css;
      },
    }),
  ],
  theme: {
    colors: {
      xyzw: {
        DEFAULT: "#fa790f",
        text: "#fa790f",
        bg: "#fa790f",
        r: "#F50000",
        g: "#00F500",
        b: "#0000F5",
      },
    },
  },
});
