# GitHub Fresh Scan

[简体中文](#简体中文) | [English](#english)

---

## 简体中文

一个 Tampermonkey 用户脚本，通过颜色高亮帮助你快速判断 GitHub 仓库是否保持更新。告别在过时项目上浪费时间，更高效地发现最新动态和活跃资源！

### 功能特性

- **时间可视化**: 通过颜色高亮显示文件/仓库的最后更新时间
- **多场景支持**:
  - GitHub 仓库文件列表页
  - GitHub 搜索结果页
  - 用户/组织的仓库列表页
  - Awesome 系列项目列表
- **高度可定制**:
  - 自定义时间阈值（天/周/月/年）
  - 自定义背景颜色、字体颜色、文件夹图标颜色
  - 支持浅色/深色主题自动切换
  - 文件按时间排序（正序/倒序）
  - 时间格式化显示
- **Awesome 增强**: 为 Awesome 列表自动获取 star 数和更新时间（需要 GitHub Token）

### 安装步骤

1. 安装 [Tampermonkey](https://www.tampermonkey.net/) 浏览器扩展
2. 点击安装脚本：[GitHub Fresh Scan](https://github.com/CzsGit/github-fresh-scan/raw/main/fresh_scan.js)
3. 访问任意 GitHub 页面，脚本将自动运行

### 使用说明

#### 基础使用

安装完成后，访问 GitHub 仓库页面，脚本会自动：
- 高亮显示最近更新的文件（默认 30 天内更新为绿色，超过 30 天为灰色）
- 在搜索结果页高亮活跃的仓库
- 格式化时间显示为 `yyyy-MM-dd` 格式

#### 自定义设置

点击 Tampermonkey 图标 → GitHub Fresh Scan → 设置面板，可以配置：

1. **主题设置**: 选择要编辑的主题（light/dark）
2. **时间阈值**: 设置判断更新活跃度的时间范围（例如：30 天）
3. **背景颜色**: 自定义高亮色和灰色背景
4. **字体颜色**: 自定义活跃/非活跃项目的文字颜色
5. **文件夹颜色**: 自定义文件夹图标的颜色
6. **时间格式化**: 开启/关闭时间格式化显示
7. **文件排序**: 按时间正序或倒序排列文件
8. **当前主题**: 选择 auto（跟随系统）/light/dark
9. **Awesome Token**: 为 Awesome 列表功能配置 GitHub Personal Access Token

#### Awesome 功能

当访问包含 "awesome" 关键词的仓库时，脚本会自动：
- 为列表中的 GitHub 链接获取 star 数
- 显示仓库的最后更新时间
- 根据活跃度高亮显示

注意：此功能需要 GitHub Personal Access Token，在设置面板中配置。

### 技术特性

- **智能检测**: 自动检测页面类型并应用相应的处理逻辑
- **性能优化**:
  - 使用 WeakSet 追踪已处理元素，避免重复处理
  - Debounce 防抖优化
  - IntersectionObserver 实现懒加载
- **兼容性**:
  - 支持 GitHub 的 PJAX 导航
  - 处理 React 动态渲染
  - jQuery 兼容层确保稳定运行

### 依赖库

- jQuery 3.6.0
- SweetAlert2 11
- Pickr 1.9.1（颜色选择器）
- Luxon 3.4.3（时间处理）

### 开源协议

Apache License 2.0

### 贡献

欢迎提交 Issue 和 Pull Request！

### 鸣谢

项目部分功能参考了 [GitHub-Freshness](https://github.com/rational-stars/GitHub-Freshness)，特此鸣谢！

---

## English

A Tampermonkey userscript that helps you quickly determine whether a GitHub repository is being actively updated through color highlighting. No more wasting time on outdated projects—find the latest updates and active resources more efficiently!

### Features

- **Time Visualization**: Highlight files/repositories by their last update time
- **Multi-Scenario Support**:
  - GitHub repository file lists
  - GitHub search results
  - User/Organization repository lists
  - Awesome project lists
- **Highly Customizable**:
  - Custom time threshold (day/week/month/year)
  - Custom background color, font color, and folder icon color
  - Auto theme switching (light/dark)
  - File sorting by time (ascending/descending)
  - Time format display
- **Awesome Enhancement**: Automatically fetch star count and update time for Awesome lists (requires GitHub Token)

### Installation

1. Install [Tampermonkey](https://www.tampermonkey.net/) browser extension
2. Click to install: [GitHub Fresh Scan](https://github.com/CzsGit/github-fresh-scan/raw/main/fresh_scan.js)
3. Visit any GitHub page, the script will run automatically

### Usage

#### Basic Usage

After installation, visit any GitHub repository page, the script will automatically:
- Highlight recently updated files (default: green for updates within 30 days, grey for older)
- Highlight active repositories in search results
- Format time display to `yyyy-MM-dd` format

#### Custom Settings

Click Tampermonkey icon → GitHub Fresh Scan → Settings Panel to configure:

1. **Theme Settings**: Choose theme to edit (light/dark)
2. **Time Threshold**: Set time range for activity judgment (e.g., 30 days)
3. **Background Color**: Customize highlight and grey colors
4. **Font Color**: Customize text colors for active/inactive items
5. **Folder Color**: Customize folder icon colors
6. **Time Format**: Enable/disable time formatting
7. **File Sorting**: Sort files by time (ascending/descending)
8. **Current Theme**: Choose auto (follow system)/light/dark
9. **Awesome Token**: Configure GitHub Personal Access Token for Awesome features

#### Awesome Feature

When visiting repositories with "awesome" keyword, the script will automatically:
- Fetch star count for GitHub links in the list
- Display repository's last update time
- Highlight based on activity level

Note: This feature requires a GitHub Personal Access Token, configure it in the settings panel.

### Technical Features

- **Smart Detection**: Automatically detect page type and apply corresponding logic
- **Performance Optimization**:
  - Use WeakSet to track processed elements, avoid duplicate processing
  - Debounce optimization
  - IntersectionObserver for lazy loading
- **Compatibility**:
  - Support GitHub's PJAX navigation
  - Handle React dynamic rendering
  - jQuery compatibility layer ensures stable operation

### Dependencies

- jQuery 3.6.0
- SweetAlert2 11
- Pickr 1.9.1 (Color Picker)
- Luxon 3.4.3 (Time Processing)

### License

Apache License 2.0

### Contributing

Issues and Pull Requests are welcome!

### Acknowledgments

Parts of this project were inspired by [GitHub-Freshness](https://github.com/rational-stars/GitHub-Freshness). Special thanks!
