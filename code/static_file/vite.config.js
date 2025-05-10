import {
	defineConfig
} from 'vite';
import vue from '@vitejs/plugin-vue2';
import path from 'path';
import fs from 'fs';
const args = process.argv.slice(2);
const outDirArg = args.find(arg => arg.startsWith('--outDir='));
const output = outDirArg ? outDirArg.split('=')[1] : './dist';

// 读取 package.json 获取版本号
const packageJson = JSON.parse(fs.readFileSync(path.join(__dirname, 'package.json'), 'utf-8'));
const versionName = `v${packageJson.version}`;

// 版本注入插件
function injectVersionPlugin() {
	return {
	  name: 'inject-version',
	  transformIndexHtml(html) {
		// 在 head 标签结束前插入版本号脚本
		return html.replace(
		  '</head>',
		  `		<script>const versionName='${versionName}';</script>\n</head>`
		);
	  },
	};
}

function transformHrefPlugin() {
	return {
		name: 'transform-href',
		// 改用 transform 前的处理钩子
		enforce: 'pre',
		transform(code, id) {
			if (!id.endsWith('.vue')) {
				return;
			}
			if(output!=='./dist'){
				return;
			}
			// 解析 Vue SFC
			const sfcRegex = /<template>([\s\S]*)<\/template>/;
			const templateMatch = code.match(sfcRegex);

			if (!templateMatch) {
				console.log('未找到 template 部分');
				return;
			}

			const template = templateMatch[1];

			const outputDir = '____outputDir____';

			// 处理模板中的 a 标签
			const aTagRegex = /<a\s+[^>]*?href\s*=\s*['"]([^'"]*)['"]/g;
			let match;
			let transformedTemplate = template;

			while ((match = aTagRegex.exec(template)) !== null) {
				const fullMatch = match[0];
				const href = match[1];
				console.log('找到 a 标签, href:', href);

				// 其余逻辑保持不变
				if (href.startsWith('http://') || href.startsWith('https://')) {
					console.log('跳过外部链接:', href);
					continue;
				}

				const cleanHref = href.startsWith('/') ? href.substring(1) : href;
				// 在路径的最后一个目录前插入 dist
				const parts = cleanHref.split('/');
				const fileName = parts.pop(); // 取出文件名
				const distPath = ['windows',...parts, 'dist', fileName].join('/');
				const absolutePath = path.join(outputDir, distPath).replace(/\\/g, '/');
				console.log('处理前:', href);
				console.log('处理后:', absolutePath);

				transformedTemplate = transformedTemplate.replace(
					fullMatch,
					fullMatch.replace(href, absolutePath)
				);
			}

			// 替换原始模板
			return code.replace(template, transformedTemplate);
		}
	};
}

export default defineConfig({
	base: './',
	plugins: [vue(),
	transformHrefPlugin(),injectVersionPlugin()],
	build: {
		target: 'es2015',
		rollupOptions: {
			input: {
				main: path.resolve(__dirname, "index.html"),
			},
			output: {
				dir: output
			},
		},
		terserOptions: {
			compress: {
				drop_console: true,
				drop_debugger: true,
			},
		},
	},
});