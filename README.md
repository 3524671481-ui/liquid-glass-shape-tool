# Liquid Glass Shape Tool

一个用于把 SVG 图形转换成液态玻璃效果的网页工具。

## 功能

- 默认加载 `assets/default-shape.svg` 作为玻璃图形。
- 支持导入自定义 SVG，并保持 SVG 原始比例。
- 支持替换背景图片或视频。
- 支持拖动图形位置，以及用右下角控制点等比例缩放。
- 右侧设置面板可折叠，并按导入、边缘、内部、外观、操作分类。
- 可调节边缘折射、高光、模糊、染色透明度、水波纹理等参数。

## 在线访问

https://3524671481-ui.github.io/liquid-glass-shape-tool/

## 本地打开

直接用浏览器打开 `index.html` 即可。

## 项目文件

- `index.html`：网页结构和设置面板。
- `styles.css`：页面背景和基础布局。
- `glass.css`：玻璃元素基础样式。
- `controls.css`：右侧设置面板样式。
- `container.js`：WebGL 液态玻璃渲染核心。
- `button.js`：玻璃图形实例。
- `controls.js`：设置面板和 SVG/背景导入逻辑。
- `app.js`：默认背景、默认 SVG、拖拽缩放和页面初始化。
- `assets/`：默认背景和默认 SVG 资源。

## License

MIT
