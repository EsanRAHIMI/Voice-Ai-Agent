// backend_api/src/code/code.service.ts
import { Injectable } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class CodeService {
  private projectRoot = path.resolve(__dirname, '../../../'); // مسیر ریشه پروژه

  private roots = {
    backend: path.join(this.projectRoot, 'backend'),
    frontend: path.join(this.projectRoot, 'frontend'),
  };

  private excludedDirs = [
    'venv', 'package-lock.json', 'node_modules', '.git', 'dist', 'build', 'coverage','output.css', 
    '.next', '__pycache__', '.DS_Store', 'README.md','code.controller.ts','code.service.ts','code.module.ts',
  ];
  private includedExtensions = [
    ".py",
    ".ts",
    ".js",
    "*.json",
    ".tsx",
    ".jsx",
    ".html", ".css", ".md", ".yml", ".txt"];

  private shouldIncludeFile(filePath: string): boolean {
    const ext = path.extname(filePath).toLowerCase();
    return this.includedExtensions.includes(ext);
  }

  private getAllFiles(dirPath: string, arrayOfFiles: string[] = []): string[] {
    if (!fs.existsSync(dirPath)) return arrayOfFiles;

    const files = fs.readdirSync(dirPath, { withFileTypes: true });

    files.forEach(file => {
      if (this.excludedDirs.includes(file.name)) return;

      const fullPath = path.join(dirPath, file.name);

      if (file.isDirectory()) {
        this.getAllFiles(fullPath, arrayOfFiles);
      } else if (this.shouldIncludeFile(fullPath)) {
        arrayOfFiles.push(fullPath);
      }
    });

    return arrayOfFiles;
  }

  private getDirectoryStructure(dirPath: string): { name: string; type: string; children?: any[] }[] {
    if (!fs.existsSync(dirPath)) return [];

    const files = fs.readdirSync(dirPath, { withFileTypes: true });
    return files
      .filter(file => !this.excludedDirs.includes(file.name))
      .map(file => {
        const fullPath = path.join(dirPath, file.name);
        if (file.isDirectory()) {
          const children = this.getDirectoryStructure(fullPath);
          return { name: file.name, type: 'directory', children };
        }
        return { name: file.name, type: 'file', path: fullPath };
      });
  }

  private generateTree(nodes: { name: string; type: string; children?: any[] }[], prefix = ''): string {
    return nodes
      .map((node, index, array) => {
        const isLast = index === array.length - 1;
        const connector = isLast ? '└── ' : '├── ';
        const subPrefix = prefix + (isLast ? '    ' : '│   ');
  
        if (node.type === 'directory') {
          return `${prefix}${connector}${node.name}/\n${this.generateTree(node.children || [], subPrefix)}`;
        }
        return `${prefix}${connector}${node.name}`;
      })
      .join('\n');
  }  

  getCodeData() {
    try {
      const allFiles: string[] = [];
      Object.entries(this.roots).forEach(([name, root]) => {
        if (!fs.existsSync(root)) {
          console.warn(`🚨 Skipping non-existent directory: ${root}`);
          return;
        }
        console.log(`✅ Directory found: ${root}`);
        this.getAllFiles(root, allFiles);
      });
      

      const fileContents = allFiles.map(file => {
        try {
          const relativePath = path.relative(this.projectRoot, file);
          const content = fs.readFileSync(file, 'utf-8');
          return { file: relativePath, content };
        } catch (error) {
          return { file, content: 'Error: Cannot read file' };
        }
      });
      
      const directoryTree = Object.entries(this.roots)
        .map(([name, rootPath]) => {
          if (!fs.existsSync(rootPath)) return `${name}/\n  ❌ Directory not found`;

          const structure = this.getDirectoryStructure(rootPath);
          return structure.length > 0 ? `${name}/\n${this.generateTree(structure)}` : `${name}/\n  🟡 Empty directory`;
        })
        .join('\n\n');

      return { files: fileContents, directoryTree };
    } catch (err) {
      return { error: '❌ Error processing request', details: (err as Error).message };
    }
  }
}
