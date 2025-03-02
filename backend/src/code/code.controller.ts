import { Controller, Get, Query, Res } from '@nestjs/common';
import { CodeService } from './code.service';
import { Response } from 'express';
import * as fs from 'fs';
import * as path from 'path';

@Controller('code')
export class CodeController {
  constructor(private readonly codeService: CodeService) {}

  @Get()
  async getCodeData(
    @Query('directory') directory: string,
    @Query('search') search: string,
    @Res() res: Response
  ) {
    const data = this.codeService.getCodeData();

    // فیلتر کردن دایرکتوری‌های اصلی (بدون نمایش فایل‌ها)
    const uniqueDirectories = Array.from(
      new Set(data.files?.map(file => file.file.split(path.sep)[0]) || [])
    ).filter(dir => !dir.includes('.')); // حذف فایل‌ها از لیست

    // فیلتر کردن فایل‌ها بر اساس دایرکتوری انتخاب‌شده
    let filteredFiles = directory
      ? data.files?.filter(file => file.file.startsWith(directory))
      : data.files;

    // **اصلاح نمایش درخت دایرکتوری فقط برای دایرکتوری انتخاب‌شده**
    let filteredDirectoryTree = '';
    if (directory) {
      // **ساخت درخت به صورت پویا برای دایرکتوری انتخابی**
      const dirFiles = data.files
        ?.filter(file => file.file.startsWith(directory))
        .map(file => file.file.replace(directory + '/', '')) // حذف مسیر دایرکتوری اصلی
        .map(file => file.split(path.sep)); // تبدیل مسیر به آرایه‌ای از پوشه‌ها

      function buildTree(paths: string[][], prefix = ''): string {
        const levels: Record<string, string[][]> = {};
        paths.forEach(parts => {
          const [first, ...rest] = parts;
          if (!levels[first]) levels[first] = [];
          if (rest.length) levels[first].push(rest);
        });

        return Object.entries(levels)
          .map(([name, subPaths]) => {
            const subTree = subPaths.length ? buildTree(subPaths, prefix + '│   ') : '';
            return `${prefix}├── ${name}\n${subTree}`;
          })
          .join('');
      }

      filteredDirectoryTree = `
        <pre style="background: #333; padding: 10px; border-radius: 5px; overflow-x: auto; color: lightblue;">
          ${directory}/\n${buildTree(dirFiles || [])}
        </pre>
      `;
    } else {
      filteredDirectoryTree = `<pre style="background: #333; padding: 10px; border-radius: 5px; overflow-x: auto; color: lightblue;">
        ${data.directoryTree?.replace(/\n/g, '<br>') || ''}
      </pre>`;
    }

    // جستجو در نام و محتوای فایل‌ها (پس از کلیک دکمه)
    if (search) {
      const lowerSearch = search.toLowerCase();
      filteredFiles = filteredFiles?.filter(
        file =>
          file.file.toLowerCase().includes(lowerSearch) ||
          file.content.toLowerCase().includes(lowerSearch)
      );
    }

    // نمایش فایل‌ها
    const formattedFiles = filteredFiles?.map(file => `
      <div style="margin-bottom: 20px; border-bottom: 2px solid gray; padding-bottom: 10px;">
        <h2 style="color: lightgreen;"># ${file.file} 
          <a href="/code/download?file=${file.file}" style="color: yellow; text-decoration: none;">🔻</a>
        </h2>
        <pre style="background: #222; padding: 10px; border-radius: 5px; overflow-x: auto; color: white;">
          <code>${file.content.replace(/</g, "&lt;").replace(/>/g, "&gt;")}</code>
        </pre>
      </div>
    `).join('');

    // لیست کشویی دایرکتوری‌ها
    const directoryOptions = uniqueDirectories.map(dir => `
      <option value="${dir}" ${dir === directory ? 'selected' : ''}>${dir}</option>
    `).join('');

    // HTML خروجی
    const htmlResponse = `
      <html>
        <head>
          <title>Code Viewer</title>
          <style>
            body { font-family: monospace; background: #121212; color: #f0f0f0; padding: 20px; }
            h1 { color: #ffa500; }
            select, input, button { background: #222; color: white; padding: 5px; border: none; margin-bottom: 10px; }
            .controls { display: flex; align-items: center; gap: 15px; margin-bottom: 20px; }
            button { cursor: pointer; padding: 5px 10px; border-radius: 5px; }
            button:hover { background: #555; }
          </style>
          <script>
            function updateDirectory() {
              const selectedDirectory = document.getElementById('directory-select').value;
              window.location.href = '/code?directory=' + encodeURIComponent(selectedDirectory);
            }

            function searchFiles() {
              const selectedDirectory = document.getElementById('directory-select').value;
              const searchQuery = document.getElementById('search-input').value;
              window.location.href = '/code?directory=' + encodeURIComponent(selectedDirectory) + '&search=' + encodeURIComponent(searchQuery);
            }
          </script>
        </head>
        <body>
          <div class="controls">
            <label for="directory-select">Select Directory:</label>
            <select id="directory-select" onchange="updateDirectory()">
              <option value="">All Directories</option>
              ${directoryOptions}
            </select>

            <label for="search-input">Search:</label>
            <input type="text" id="search-input" value="${search || ''}" placeholder="Search files or content..." />
            <button onclick="searchFiles()">🔍 Search</button>
          </div>

          <h1>Project Directory Structure:</h1>
          ${filteredDirectoryTree}

          <h1>Selected Files Content:</h1>
          ${formattedFiles?.length ? formattedFiles : "<p style='color: red;'>No files available</p>"}
        </body>
      </html>
    `;

    res.setHeader('Content-Type', 'text/html');
    res.send(htmlResponse);
  }

  @Get('download')
  async downloadFile(@Query('file') filePath: string, @Res() res: Response) {
    if (!filePath) {
      return res.status(400).send('File path is required');
    }

    const absolutePath = path.resolve(__dirname, '../../../../', filePath);

    if (!fs.existsSync(absolutePath)) {
      return res.status(404).send('File not found');
    }

    res.download(absolutePath);
  }
}
