// ==UserScript==
// @name         GitHub freshscan
// @namespace    http://tampermonkey.net/
// @version      1.0.0
// @description  通过颜色高亮的方式，帮助你快速判断一个 GitHub 仓库是否在更新。
// @author       https://github.com/CzsGit/github-fresh-scan 
// @license      Apache License 2.0
// @icon         https://avatars.githubusercontent.com/u/16255872?v=4
// @match        https://github.com/*/*
// @match        https://github.com/*
// @match        https://github.com/search?*
// @match        https://github.com/*/*/tree/*
// @require      https://code.jquery.com/jquery-3.6.0.min.js
// @require      https://cdn.jsdelivr.net/npm/sweetalert2@11
// @require      https://cdn.jsdelivr.net/npm/@simonwep/pickr@1.9.1/dist/pickr.min.js
// @require      https://cdn.jsdelivr.net/npm/luxon@3.4.3/build/global/luxon.min.js
// @grant        GM_registerMenuCommand
// @grant        GM_setValue
// @grant        GM_getValue
// @grant        GM_addStyle
// ==/UserScript==

;(function () {
  // 引入 Luxon
  const DateTime = luxon.DateTime
    // 解析日期（指定格式和时区）
    ; ('use strict')

  // === jQuery 加载检测和兼容层 ===
  // 确保 jQuery 正确加载，避免与原生 $ 冲突
  let $ = window.jQuery;
  if (typeof window.jQuery === 'undefined') {
    console.warn('[GitHub freshscan] jQuery 未加载，等待加载...');
    // 创建简单的兼容层，使用原生 API
    $ = function(selector) {
      if (typeof selector === 'string') {
        const elements = document.querySelectorAll(selector);
        // 创建类 jQuery 对象
        const jQueryLike = Object.assign(Array.from(elements), {
          length: elements.length,
          each: function(callback) {
            this.forEach((el, index) => callback.call(el, index));
            return this;
          },
          attr: function(name, value) {
            if (value === undefined) {
              return this[0] ? this[0].getAttribute(name) : null;
            }
            this.forEach(el => el.setAttribute(name, value));
            return this;
          },
          css: function(prop, value) {
            if (typeof prop === 'object') {
              this.forEach(el => Object.assign(el.style, prop));
            } else if (value === undefined) {
              return this[0] ? window.getComputedStyle(this[0])[prop] : null;
            } else {
              this.forEach(el => el.style[prop] = value);
            }
            return this;
          },
          text: function(value) {
            if (value === undefined) {
              return this[0] ? this[0].textContent : '';
            }
            this.forEach(el => el.textContent = value);
            return this;
          },
          closest: function(selector) {
            const el = this[0] ? this[0].closest(selector) : null;
            return el ? $(el) : $([]);
          },
          find: function(selector) {
            const found = this[0] ? this[0].querySelectorAll(selector) : [];
            return $(Array.from(found));
          },
          parent: function() {
            const parent = this[0] ? this[0].parentElement : null;
            return parent ? $(parent) : $([]);
          },
          before: function(html) {
            if (this[0]) {
              this[0].insertAdjacentHTML('beforebegin', html);
            }
            return this;
          },
          after: function(html) {
            if (this[0]) {
              this[0].insertAdjacentHTML('afterend', html);
            }
            return this;
          },
          val: function(value) {
            if (value === undefined) {
              return this[0] ? this[0].value : '';
            }
            this.forEach(el => el.value = value);
            return this;
          },
          prop: function(name, value) {
            if (value === undefined) {
              return this[0] ? this[0][name] : undefined;
            }
            this.forEach(el => el[name] = value);
            return this;
          },
          on: function(event, handler) {
            this.forEach(el => el.addEventListener(event, handler));
            return this;
          },
          first: function() {
            return this.length > 0 ? $(this[0]) : $([]);
          }
        });
        return jQueryLike;
      } else if (selector && selector.nodeType) {
        // 传入 DOM 元素
        return Object.assign([selector], {
          length: 1,
          each: function(callback) { callback.call(selector, 0); return this; },
          attr: function(name, value) {
            if (value === undefined) return selector.getAttribute(name);
            selector.setAttribute(name, value);
            return this;
          },
          css: function(prop, value) {
            if (typeof prop === 'object') {
              Object.assign(selector.style, prop);
            } else if (value === undefined) {
              return window.getComputedStyle(selector)[prop];
            } else {
              selector.style[prop] = value;
            }
            return this;
          },
          text: function(value) {
            if (value === undefined) return selector.textContent;
            selector.textContent = value;
            return this;
          },
          closest: function(sel) {
            const el = selector.closest(sel);
            return el ? $(el) : $([]);
          },
          find: function(sel) {
            return $(Array.from(selector.querySelectorAll(sel)));
          },
          parent: function() {
            return selector.parentElement ? $(selector.parentElement) : $([]);
          },
          before: function(html) {
            selector.insertAdjacentHTML('beforebegin', html);
            return this;
          },
          after: function(html) {
            selector.insertAdjacentHTML('afterend', html);
            return this;
          },
          val: function(value) {
            if (value === undefined) return selector.value;
            selector.value = value;
            return this;
          },
          prop: function(name, value) {
            if (value === undefined) return selector[name];
            selector[name] = value;
            return this;
          },
          on: function(event, handler) {
            selector.addEventListener(event, handler);
            return this;
          },
          first: function() {
            return this;
          }
        });
      } else if (Array.isArray(selector)) {
        // 传入数组
        return Object.assign(selector, {
          each: function(callback) {
            this.forEach((el, index) => callback.call(el, index));
            return this;
          },
          attr: function(name, value) {
            if (value === undefined) {
              return this[0] ? this[0].getAttribute(name) : null;
            }
            this.forEach(el => el.setAttribute(name, value));
            return this;
          }
        });
      }
      return $([]);
    };

    // 添加 ajax 支持（如果需要）
    $.ajax = function(options) {
      return fetch(options.url, {
        method: options.method || 'GET',
        headers: options.headers || {}
      }).then(response => response.json())
        .then(data => options.success && options.success(data))
        .catch(err => options.error && options.error(err));
    };

    console.log('[GitHub freshscan] 使用 jQuery 兼容层');
  }

  // 引入 Pickr CSS
  GM_addStyle(`@import url('https://cdn.jsdelivr.net/npm/@simonwep/pickr@1.9.1/dist/themes/nano.min.css');`)
  GM_addStyle(`
    /* 主弹窗样式 */
    .swal2-popup.swal2-modal.swal2-show {
      width: 680px !important;
      max-width: 90vw;
      padding: 0 !important;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%) !important;
      border-radius: 24px !important;
      box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3) !important;
      color: #fff;
    }

    /* 标题区域 */
    .swal2-title {
      display: flex !important;
      align-items: center;
      justify-content: center;
      gap: 12px;
      padding: 24px 32px 16px !important;
      margin: 0 !important;
      font-size: 24px !important;
      font-weight: 600 !important;
      color: #fff !important;
      background: transparent !important;
    }

    .swal2-title img {
      width: 36px !important;
      height: 36px !important;
      border-radius: 50%;
      border: 2px solid rgba(255, 255, 255, 0.3);
    }

    .swal2-title a {
      color: #fff !important;
      text-decoration: none;
      transition: opacity 0.2s;
    }

    .swal2-title a:hover {
      opacity: 0.8;
    }

    /* 内容区域 */
    .swal2-html-container {
      margin: 0 !important;
      padding: 0 !important;
      max-height: 65vh;
      overflow-y: auto;
    }

    /* 自定义滚动条 */
    .swal2-html-container::-webkit-scrollbar {
      width: 8px;
    }

    .swal2-html-container::-webkit-scrollbar-track {
      background: rgba(255, 255, 255, 0.1);
      border-radius: 4px;
    }

    .swal2-html-container::-webkit-scrollbar-thumb {
      background: rgba(255, 255, 255, 0.3);
      border-radius: 4px;
    }

    .swal2-html-container::-webkit-scrollbar-thumb:hover {
      background: rgba(255, 255, 255, 0.5);
    }

    /* 设置容器 */
    .settings-container {
      padding: 0 32px 24px;
    }

    /* 设置项卡片 */
    .setting-card {
      background: rgba(255, 255, 255, 0.15);
      backdrop-filter: blur(10px);
      border-radius: 16px;
      padding: 20px;
      margin-bottom: 16px;
      border: 1px solid rgba(255, 255, 255, 0.2);
      transition: all 0.3s ease;
    }

    .setting-card:hover {
      background: rgba(255, 255, 255, 0.2);
      transform: translateY(-2px);
      box-shadow: 0 8px 16px rgba(0, 0, 0, 0.1);
    }

    /* 设置项标题 */
    .setting-title {
      font-size: 16px;
      font-weight: 600;
      margin-bottom: 16px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      color: #fff;
    }

    .setting-title-text {
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .setting-title-text::before {
      content: '';
      width: 4px;
      height: 16px;
      background: #fff;
      border-radius: 2px;
    }

    /* Toggle Switch */
    .toggle-switch {
      position: relative;
      width: 44px;
      height: 24px;
      cursor: pointer;
    }

    .toggle-switch input {
      opacity: 0;
      width: 0;
      height: 0;
    }

    .toggle-slider {
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background-color: rgba(255, 255, 255, 0.3);
      border-radius: 24px;
      transition: 0.3s;
    }

    .toggle-slider:before {
      position: absolute;
      content: "";
      height: 18px;
      width: 18px;
      left: 3px;
      bottom: 3px;
      background-color: white;
      border-radius: 50%;
      transition: 0.3s;
    }

    .toggle-switch input:checked + .toggle-slider {
      background-color: rgba(76, 217, 100, 0.9);
    }

    .toggle-switch input:checked + .toggle-slider:before {
      transform: translateX(20px);
    }

    /* 设置项内容 */
    .setting-content {
      display: flex;
      flex-direction: column;
      gap: 12px;
    }

    .setting-row {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 16px;
    }

    .setting-label {
      font-size: 14px;
      color: rgba(255, 255, 255, 0.9);
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .setting-label a {
      color: #fff;
      text-decoration: underline;
    }

    /* 颜色选择器容器 */
    .color-picker-group {
      display: flex;
      gap: 12px;
      align-items: center;
    }

    .color-picker-item {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 6px;
    }

    .color-picker-label {
      font-size: 12px;
      color: rgba(255, 255, 255, 0.8);
    }

    .color-preview {
      width: 48px;
      height: 48px;
      border-radius: 12px;
      cursor: pointer;
      border: 3px solid rgba(255, 255, 255, 0.4);
      transition: all 0.2s;
      position: relative;
    }

    .color-preview:hover {
      transform: scale(1.1);
      border-color: rgba(255, 255, 255, 0.8);
    }

    .color-preview::after {
      content: '✎';
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      font-size: 18px;
      color: rgba(0, 0, 0, 0.3);
      opacity: 0;
      transition: opacity 0.2s;
    }

    .color-preview:hover::after {
      opacity: 1;
    }

    /* 输入框样式 */
    .setting-input,
    .setting-select {
      background: rgba(255, 255, 255, 0.2) !important;
      border: 1px solid rgba(255, 255, 255, 0.3) !important;
      border-radius: 8px !important;
      padding: 8px 12px !important;
      color: #fff !important;
      font-size: 14px !important;
      transition: all 0.2s;
      outline: none !important;
      box-shadow: none !important;
      margin: 0 !important;
      height: auto !important;
    }

    .setting-input:focus,
    .setting-select:focus {
      background: rgba(255, 255, 255, 0.25) !important;
      border-color: rgba(255, 255, 255, 0.5) !important;
    }

    .setting-input::placeholder {
      color: rgba(255, 255, 255, 0.5);
    }

    .setting-select option {
      background: #667eea;
      color: #fff;
    }

    /* 时间阈值输入组 */
    .time-threshold-group {
      display: flex;
      gap: 8px;
      align-items: center;
    }

    .time-threshold-group .setting-input {
      width: 80px;
      text-align: center;
    }

    .time-threshold-group .setting-select {
      width: 100px;
    }

    /* 范围滑块 */
    .range-slider {
      width: 100%;
      height: 6px;
      border-radius: 3px;
      background: rgba(255, 255, 255, 0.2);
      outline: none;
      -webkit-appearance: none;
    }

    .range-slider::-webkit-slider-thumb {
      -webkit-appearance: none;
      width: 18px;
      height: 18px;
      border-radius: 50%;
      background: #fff;
      cursor: pointer;
      box-shadow: 0 2px 6px rgba(0, 0, 0, 0.2);
    }

    .range-slider::-moz-range-thumb {
      width: 18px;
      height: 18px;
      border-radius: 50%;
      background: #fff;
      cursor: pointer;
      border: none;
      box-shadow: 0 2px 6px rgba(0, 0, 0, 0.2);
    }

    /* 按钮区域 */
    .swal2-actions {
      padding: 16px 32px 24px !important;
      margin: 0 !important;
      gap: 12px !important;
    }

    .swal2-confirm,
    .swal2-cancel {
      border-radius: 12px !important;
      padding: 12px 32px !important;
      font-size: 15px !important;
      font-weight: 600 !important;
      border: none !important;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15) !important;
      transition: all 0.2s !important;
      margin: 0 !important;
    }

    .swal2-confirm {
      background: rgba(76, 217, 100, 0.9) !important;
      color: #fff !important;
    }

    .swal2-confirm:hover {
      background: rgba(76, 217, 100, 1) !important;
      transform: translateY(-2px);
      box-shadow: 0 6px 16px rgba(0, 0, 0, 0.2) !important;
    }

    .swal2-cancel {
      background: rgba(255, 255, 255, 0.2) !important;
      color: #fff !important;
    }

    .swal2-cancel:hover {
      background: rgba(255, 255, 255, 0.3) !important;
    }

    /* Pickr 样式覆盖 */
    .pcr-app {
      background: #fff;
      border-radius: 12px;
      box-shadow: 0 8px 24px rgba(0, 0, 0, 0.2);
    }

    /* 提示文本 */
    .setting-hint {
      font-size: 12px;
      color: rgba(255, 255, 255, 0.7);
      line-height: 1.5;
      margin-top: 8px;
      padding: 12px;
      background: rgba(255, 255, 255, 0.1);
      border-radius: 8px;
      border-left: 3px solid rgba(255, 255, 255, 0.4);
    }

    .setting-hint a {
      color: #fff;
      text-decoration: underline;
    }

    /* 预设主题按钮组 */
    .preset-themes {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
      gap: 8px;
      margin-top: 12px;
    }

    .preset-theme-btn {
      padding: 12px;
      border-radius: 10px;
      border: 2px solid rgba(255, 255, 255, 0.3);
      background: rgba(255, 255, 255, 0.15);
      color: #fff;
      font-size: 13px;
      cursor: pointer;
      transition: all 0.2s;
      text-align: center;
      display: flex;
      flex-direction: column;
      gap: 4px;
      align-items: center;
    }

    .preset-theme-btn:hover {
      background: rgba(255, 255, 255, 0.25);
      border-color: rgba(255, 255, 255, 0.5);
      transform: translateY(-2px);
    }

    .preset-theme-btn.active {
      background: rgba(76, 217, 100, 0.3);
      border-color: rgba(76, 217, 100, 0.8);
    }

    .preset-theme-colors {
      display: flex;
      gap: 4px;
    }

    .preset-theme-color {
      width: 16px;
      height: 16px;
      border-radius: 4px;
      border: 1px solid rgba(255, 255, 255, 0.3);
    }
  `)
  const PanelDom = `
    <div class="settings-container">
      <!-- 主题配置卡片 -->
      <div class="setting-card">
        <div class="setting-title">
          <span class="setting-title-text">主题配置</span>
          <select id="THEME-select" class="setting-select" style="width: 120px;">
            <option value="light">浅色主题</option>
            <option value="dark">深色主题</option>
          </select>
        </div>
        <div class="setting-content">
          <div class="setting-row">
            <span class="setting-label">当前主题模式</span>
            <select id="CURRENT_THEME-select" class="setting-select" style="width: 140px;">
              <option value="auto">🌓 跟随系统</option>
              <option value="light">☀️ 浅色</option>
              <option value="dark">🌙 深色</option>
            </select>
          </div>
        </div>
      </div>

      <!-- 时间阈值卡片 -->
      <div class="setting-card">
        <div class="setting-title">
          <span class="setting-title-text">⏰ 时间阈值</span>
        </div>
        <div class="setting-content">
          <div class="setting-row">
            <span class="setting-label">活跃度判断标准</span>
            <div class="time-threshold-group">
              <input id="TIME_BOUNDARY-number" type="number" class="setting-input" value="" min="1" max="999" />
              <select id="TIME_BOUNDARY-select" class="setting-select">
                <option value="day">天</option>
                <option value="week">周</option>
                <option value="month">月</option>
                <option value="year">年</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      <!-- 颜色配置卡片 -->
      <div class="setting-card">
        <div class="setting-title">
          <span class="setting-title-text">🎨 背景颜色</span>
          <label class="toggle-switch">
            <input type="checkbox" id="BGC-enabled" />
            <span class="toggle-slider"></span>
          </label>
        </div>
        <div class="setting-content">
          <div class="color-picker-group">
            <div class="color-picker-item">
              <div class="color-picker-label">活跃色</div>
              <div id="BGC-highlight-color-value">
                <div class="color-preview" id="BGC-highlight-color-pickr" style="background: rgba(224, 116, 0, 1);"></div>
              </div>
            </div>
            <div class="color-picker-item">
              <div class="color-picker-label">非活跃色</div>
              <div id="BGC-grey-color-value">
                <div class="color-preview" id="BGC-grey-color-pickr" style="background: rgba(10, 40, 0, 0.59);"></div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div class="setting-card">
        <div class="setting-title">
          <span class="setting-title-text">✏️ 字体颜色</span>
          <label class="toggle-switch">
            <input type="checkbox" id="FONT-enabled" />
            <span class="toggle-slider"></span>
          </label>
        </div>
        <div class="setting-content">
          <div class="color-picker-group">
            <div class="color-picker-item">
              <div class="color-picker-label">活跃色</div>
              <div id="FONT-highlight-color-value">
                <div class="color-preview" id="FONT-highlight-color-pickr" style="background: rgba(252, 252, 252, 1);"></div>
              </div>
            </div>
            <div class="color-picker-item">
              <div class="color-picker-label">非活跃色</div>
              <div id="FONT-grey-color-value">
                <div class="color-preview" id="FONT-grey-color-pickr" style="background: rgba(0, 0, 0, 1);"></div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div class="setting-card">
        <div class="setting-title">
          <span class="setting-title-text">📁 文件夹颜色</span>
          <label class="toggle-switch">
            <input type="checkbox" id="DIR-enabled" />
            <span class="toggle-slider"></span>
          </label>
        </div>
        <div class="setting-content">
          <div class="color-picker-group">
            <div class="color-picker-item">
              <div class="color-picker-label">活跃色</div>
              <div id="DIR-highlight-color-value">
                <div class="color-preview" id="DIR-highlight-color-pickr" style="background: rgba(15, 172, 83, 1);"></div>
              </div>
            </div>
            <div class="color-picker-item">
              <div class="color-picker-label">非活跃色</div>
              <div id="DIR-grey-color-value">
                <div class="color-preview" id="DIR-grey-color-pickr" style="background: rgba(154, 154, 154, 1);"></div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 功能开关卡片 -->
      <div class="setting-card">
        <div class="setting-title">
          <span class="setting-title-text">⚙️ 功能设置</span>
        </div>
        <div class="setting-content">
          <div class="setting-row">
            <span class="setting-label">📅 时间格式化</span>
            <label class="toggle-switch">
              <input type="checkbox" id="TIME_FORMAT-enabled" />
              <span class="toggle-slider"></span>
            </label>
          </div>
          <div class="setting-row">
            <span class="setting-label">🔄 文件排序</span>
            <div style="display: flex; gap: 8px; align-items: center;">
              <label class="toggle-switch">
                <input type="checkbox" id="SORT-enabled" />
                <span class="toggle-slider"></span>
              </label>
              <select id="SORT-select" class="setting-select" style="width: 120px;">
                <option value="asc">时间正序</option>
                <option value="desc">时间倒序</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      <!-- AWESOME 功能卡片 -->
      <div class="setting-card">
        <div class="setting-title">
          <span class="setting-title-text">⭐ Awesome 增强</span>
          <label class="toggle-switch">
            <input type="checkbox" id="AWESOME-enabled" />
            <span class="toggle-slider"></span>
          </label>
        </div>
        <div class="setting-content">
          <div class="setting-row">
            <span class="setting-label">
              <a target="_blank" href="https://github.com/settings/tokens">GitHub Token</a>
            </span>
            <input id="AWESOME_TOKEN" type="password" class="setting-input" placeholder="ghp_xxxxxxxxxx" style="width: 240px;" />
          </div>
          <div class="setting-hint">
            💡 启用后可为 Awesome 列表自动获取 star 数和更新时间。需要 GitHub Personal Access Token。
          </div>
        </div>
      </div>

      <!-- 提示信息 -->
      <div class="setting-hint" style="margin-top: 8px;">
        ⚠️ 部分设置（如开关）切换到关闭状态时，需要刷新页面才能完全生效。
      </div>
    </div>
  `
  // === 配置项 ===
  let default_THEME = {
    BGC: {
      highlightColor: 'rgba(224, 116, 0, 1)', // 高亮颜色
      greyColor: 'rgba(10, 40, 0, 0.59)', // 灰色（示例：深灰）
      isEnabled: true, // 是否启用背景色
    },
    TIME_BOUNDARY: {
      number: 30, // 时间阈值（示例：30）
      select: 'day', // 可能的值: "day", "week", "month", "year"
    },
    FONT: {
      highlightColor: 'rgba(252, 252, 252, 1)', // 文字高亮颜色（示例：橙红色）
      greyColor: 'rgba(0, 0, 0, 1)', // 灰色（示例：标准灰）
      isEnabled: true, // 是否启用字体颜色
    },
    DIR: {
      highlightColor: 'rgba(15, 172, 83, 1)', // 目录高亮颜色（示例：道奇蓝）
      greyColor: 'rgba(154, 154, 154, 1)', // 灰色（示例：暗灰）
      isEnabled: true, // 是否启用文件夹颜色
    },
    SORT: {
      select: 'desc', // 排序方式（可能的值："asc", "desc"）
      isEnabled: false, // 是否启用排序（默认关闭）
    },
    AWESOME: {
      isEnabled: false, // AWESOME项目是否启用
    },
    TIME_FORMAT: {
      isEnabled: true, // 是否启用时间格式化
    },
  }
  let CURRENT_THEME = GM_getValue('CURRENT_THEME', 'light')
  let AWESOME_TOKEN = GM_getValue('AWESOME_TOKEN', '')
  let THEME_TYPE = getThemeType()
  const config_JSON = JSON.parse(
    GM_getValue('config_JSON', JSON.stringify({ light: default_THEME }))
  )
  let THEME = config_JSON[THEME_TYPE] // 当前主题

  const configPickr = {
    theme: 'nano', // 使用 nano 主题，更简洁
    components: {
      preview: true,
      opacity: true,
      hue: true,
      interaction: {
        rgba: true,
        input: true,
        clear: true,
        save: true,
      },
    },
  }

  // 存储所有 Pickr 实例
  const pickrInstances = []
  // 存储 selector -> Pickr 实例的映射,用于在保存时获取颜色
  const pickrInstanceMap = {}

  function getThemeType() {
    let themeType = CURRENT_THEME
    if (CURRENT_THEME === 'auto') {
      if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
        themeType = 'dark'
      } else {
        themeType = 'light'
      }
    }
    window.console.log("如果您觉得GitHub-freshscan好用，点击下方 github链接 给个 star 吧。非常感谢你！！！\n[https://github.com/CzsGit/github-fresh-scan]", "color:green")
    return themeType
  }

  function initPickr(selector, defaultColor) {
    const el = document.querySelector(selector)
    if (!el) return null

    const pickr = Pickr.create({
      el: el,
      theme: 'nano',
      default: defaultColor,
      swatches: [
        'rgba(224, 116, 0, 1)',
        'rgba(252, 252, 252, 1)',
        'rgba(154, 154, 154, 1)',
        'rgba(10, 40, 0, 0.59)',
        'rgba(0, 0, 0, 1)',
        '#667eea',
        '#764ba2',
        '#f093fb',
        '#4facfe',
      ],
      components: {
        preview: true,
        opacity: true,
        hue: true,
        interaction: {
          rgba: true,
          input: true,
          clear: true,
          save: true,
        },
      },
    })

    // 监听颜色变化事件 - 实时更新预览和 data-color
    pickr.on('change', (color, instance) => {
      if (color) {
        const colorString = color.toRGBA().toString()
        el.style.background = colorString
        el.setAttribute('data-color', colorString)
      }
    })

    // 监听保存事件 - 点击 Save 按钮时
    pickr.on('save', (color, instance) => {
      if (color) {
        const colorString = color.toRGBA().toString()
        el.style.background = colorString
        el.setAttribute('data-color', colorString)
      }
      // 不自动隐藏,让用户可以继续调整
    })

    // 监听隐藏事件 - 关闭 Pickr 时保存当前颜色
    pickr.on('hide', (instance) => {
      const color = pickr.getColor()
      if (color) {
        const colorString = color.toRGBA().toString()
        el.style.background = colorString
        el.setAttribute('data-color', colorString)
      }
    })

    // 存储到实例数组和映射表
    pickrInstances.push(pickr)
    pickrInstanceMap[selector] = pickr

    return pickr
  }

  // 清理所有 Pickr 实例
  function destroyAllPickr() {
    pickrInstances.forEach(pickr => {
      if (pickr) pickr.destroyAndRemove()
    })
    pickrInstances.length = 0
    // 清空映射表
    for (let key in pickrInstanceMap) {
      delete pickrInstanceMap[key]
    }
  }
  const preConfirm = () => {
    // 遍历默认主题配置，更新设置
    const updated_THEME = getUpdatedThemeConfig()
    CURRENT_THEME = $('#CURRENT_THEME-select').val()
    AWESOME_TOKEN = $('#AWESOME_TOKEN').val()

    const selectedThemeType = $('#THEME-select').val()

    // 更新 config_JSON
    const newConfigJSON = {
      ...config_JSON,
      [selectedThemeType]: updated_THEME,
    }

    // 保存到油猴存储
    GM_setValue('config_JSON', JSON.stringify(newConfigJSON))
    GM_setValue('CURRENT_THEME', CURRENT_THEME)
    GM_setValue('AWESOME_TOKEN', AWESOME_TOKEN)

    // 更新全局变量
    Object.assign(config_JSON, newConfigJSON)
    THEME_TYPE = getThemeType()
    THEME = config_JSON[THEME_TYPE]

    console.log('[GitHub freshscan] 配置已保存:', {
      THEME_TYPE,
      updated_THEME,
      CURRENT_THEME,
    })

    // 重新执行扫描以应用新设置
    resetProcessedElements()
    GitHub_freshscan(THEME)

    Swal.fire({
      position: 'top-center',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      icon: 'success',
      title: '设置已保存',
      showConfirmButton: false,
      timer: 1000,
    })
  }
  function initSettings(theme) {
    // 清理之前的 Pickr 实例
    destroyAllPickr()

    // 初始化所有颜色选择器
    initPickr('#BGC-highlight-color-pickr', theme.BGC.highlightColor)
    initPickr('#BGC-grey-color-pickr', theme.BGC.greyColor)
    initPickr('#FONT-highlight-color-pickr', theme.FONT.highlightColor)
    initPickr('#FONT-grey-color-pickr', theme.FONT.greyColor)
    initPickr('#DIR-highlight-color-pickr', theme.DIR.highlightColor)
    initPickr('#DIR-grey-color-pickr', theme.DIR.greyColor)

    // 设置选择器值
    $('#THEME-select').val(getThemeType())
    $('#CURRENT_THEME-select').val(CURRENT_THEME)
    $('#AWESOME_TOKEN').val(AWESOME_TOKEN)

    // 填充表单数据
    handelData(theme)
  }
  function getUpdatedThemeConfig() {
    // 创建一个新的对象，用于存储更新后的主题配置
    let updatedTheme = {}

    // 遍历默认主题配置，更新需要的键值
    for (const [themeKey, themeVal] of Object.entries(default_THEME)) {
      updatedTheme[themeKey] = {} // 创建每个主题键名的嵌套对象

      for (let [key, val] of Object.entries(themeVal)) {
        switch (key) {
          case 'highlightColor':
            // 优先从 Pickr 实例获取颜色
            const highlightSelector = `#${themeKey}-highlight-color-pickr`
            const highlightPickr = pickrInstanceMap[highlightSelector]

            if (highlightPickr) {
              const color = highlightPickr.getColor()
              val = color ? color.toRGBA().toString() : val
            } else {
              // 回退方案：从 DOM 元素获取
              const highlightEl = document.querySelector(highlightSelector)
              val = highlightEl ? (highlightEl.getAttribute('data-color') || highlightEl.style.background || val) : val
            }
            break

          case 'greyColor':
            // 优先从 Pickr 实例获取颜色
            const greySelector = `#${themeKey}-grey-color-pickr`
            const greyPickr = pickrInstanceMap[greySelector]

            if (greyPickr) {
              const color = greyPickr.getColor()
              val = color ? color.toRGBA().toString() : val
            } else {
              // 回退方案：从 DOM 元素获取
              const greyEl = document.querySelector(greySelector)
              val = greyEl ? (greyEl.getAttribute('data-color') || greyEl.style.background || val) : val
            }
            break

          case 'isEnabled':
            // 判断该主题项是否启用
            val = $(`#${themeKey}-enabled`).prop('checked')
            break
          case 'number':
            // 获取时间阈值（示例：30）
            val = parseInt($(`#${themeKey}-number`).val()) || val
            break
          case 'select':
            // 获取时间单位（可能的值："day", "week", "month"）
            val = $(`#${themeKey}-select`).val() || val
            break
          default:
            // 其他未定义的情况
            break
        }

        // 更新当前键名对应的值
        updatedTheme[themeKey][key] = val
      }
    }

    return updatedTheme
  }
  function handelData(theme) {
    for (const [themeKey, themeVal] of Object.entries(theme)) {
      for (const [key, val] of Object.entries(themeVal)) {
        switch (key) {
          case 'highlightColor':
            // 设置颜色预览背景
            const highlightEl = document.querySelector(`#${themeKey}-highlight-color-pickr`)
            if (highlightEl) {
              highlightEl.style.background = val
              highlightEl.setAttribute('data-color', val)
            }
            break
          case 'greyColor':
            // 设置颜色预览背景
            const greyEl = document.querySelector(`#${themeKey}-grey-color-pickr`)
            if (greyEl) {
              greyEl.style.background = val
              greyEl.setAttribute('data-color', val)
            }
            break
          case 'isEnabled':
            $(`#${themeKey}-enabled`).prop('checked', val) // 选中
            break
          case 'number':
            $(`#${themeKey}-number`).val(val)
            break
          case 'select':
            $(`#${themeKey}-select`).val(val)
            break
          default:
            break
        }
      }
    }
  }
  // === 创建设置面板 ===
  function createSettingsPanel() {
    Swal.fire({
      title: `<a target="_blank" tabindex="-1" id="swal2-title-div" href="https://github.com/CzsGit/github-fresh-scan"><img src="https://avatars.githubusercontent.com/u/16255872?v=4" alt="CzsGit" width="40"></a><a tabindex="-1" target="_blank" href="https://github.com/CzsGit/github-fresh-scan">GitHub freshscan 设置</a>`,
      html: PanelDom,
      focusConfirm: false,
      preConfirm,
      heightAuto: false,
      showCancelButton: true,
      cancelButtonText: '取消',
      confirmButtonText: '保存设置',
    })

    initSettings(THEME)

    $('#THEME-select').on('change', function () {
      let selectedTheme = $(this).val() // 获取选中的值
      let theme = config_JSON[selectedTheme]
      console.log('主题设置变更:', selectedTheme)
      handelData(theme)
    })
  }
  function setElementBGC(el, BGC, timeResult) {
    // el是元素 BGC是 theme BGC配置对象
    if (el.length && BGC.isEnabled) {
      if (timeResult) {
        el[0].style.setProperty('background-color', BGC.highlightColor, 'important')
      } else {
        el[0].style.setProperty('background-color', BGC.greyColor, 'important')
      }
    }
  }
  function setElementDIR(el, DIR, timeResult) {
    if (el.length && DIR.isEnabled) {
      if (timeResult) {
        el.attr('fill', DIR.highlightColor)
      } else {
        el.attr('fill', DIR.greyColor)
      }
    }
  }
  function setElementTIME_FORMAT(el, TIME_FORMAT, datetime) {
    if (!datetime) return;
    const spanSelector = `span[${TIME_SPAN_ATTR}="true"]`;

    if (TIME_FORMAT.isEnabled) {
      const formattedDate = formatDate(datetime);
      let formattedSpan = el.prev(spanSelector);

      if (formattedSpan.length === 0) {
        el.css('display', 'none');
        el.before(`<span ${TIME_SPAN_ATTR}="true">${formattedDate}</span>`);
      } else {
        formattedSpan.text(formattedDate);
      }
    } else {
      const formattedSpan = el.prev(spanSelector);
      if (formattedSpan.length > 0) {
        formattedSpan.remove();
      }
      el.css('display', '');
    }
  }
  // 设置字体颜色
  function setElementFONT(el, FONT, timeResult) {
    // el是元素 FONT是 theme FONT配置对象
    if (FONT.isEnabled) {
      if (timeResult) {
        el.css('color', FONT.highlightColor)
      } else {
        el.css('color', FONT.greyColor)
      }
    }
  }
  function handelTime(time, time_boundary, type = 'ISO8601') {
    const { number, select } = time_boundary
    let days = 0
    // 根据 select 计算相应的天数
    switch (select) {
      case 'day':
        days = number
        break
      case 'week':
        days = number * 7
        break
      case 'month':
        days = number * 30
        break
      case 'year':
        days = number * 365
        break
      default:
        console.warn('无效的时间单位:', select)
        return false // 遇到无效单位直接返回 false
    }

    const now = new Date() // 当前时间
    const targetDate = new Date(now) // 复制当前时间
    targetDate.setDate(now.getDate() - days) // 计算指定时间范围的起点
    let inputDate = new Date(time) // 传入的时间转换为 Date 对象
    if (type === 'UTC') {
      // 解析日期（指定格式和时区）
      const dt = DateTime.fromFormat(time, "yyyy年M月d日 'GMT'Z HH:mm", {
        zone: 'UTC',
      }).setZone('Asia/Shanghai')
      const formattedDate = dt.toJSDate()
      inputDate = new Date(formattedDate)
    }
    return inputDate >= targetDate // 判断输入时间是否在 time_boundary 以内
  }
  // 检查 href 是否符合 https://github.com/*/* 但不是 https://github.com/*/*/ 格式
  const pattern = /^https:\/\/github\.com\/[^\/]+\/[^\/]+\/?$/;
  function isValidHref(href) {
    return pattern.test(href);
  }
  function toAPIUrl(href) {
    // 使用正则表达式从 href 中提取 owner 和 repo
    const githubPattern = /^https:\/\/github\.com\/([^\/]+)\/([^\/]+)/;
    const match = href.match(githubPattern);
    // 如果匹配成功，则生成 API URL
    if (match) {
      let owner = match[1];  // GitHub 仓库所有者
      let repo = match[2];    // GitHub 仓库名称

      // 返回转换后的 GitHub API URL
      return 'https://api.github.com/repos/' + owner + '/' + repo;
    } else {
      console.log("无效的 GitHub 链接:", href);
      return null;
    }
  }

  // === 全局变量 ===
  let isProcessing = false; // 防止重复执行
  let processedElements = new WeakSet(); // 记录已处理的元素
  let mutationObserver = null; // MutationObserver 实例
  let pollingInterval = null; // 轮询检查定时器
  const STATUS_ACTIVE = 'freshscan-active';
  const STATUS_STALE = 'freshscan-stale';
  const STATUS_ATTR = 'data-freshscan-status';
  const TIME_SPAN_ATTR = 'data-freshscan-time';

  function normalizeColorValue(color) {
    if (!color) return '';
    if (!document.body) return color;
    const temp = document.createElement('div');
    temp.style.display = 'none';
    temp.style.backgroundColor = color;
    document.body.appendChild(temp);
    const computed = window.getComputedStyle(temp).backgroundColor;
    temp.remove();
    return computed || color;
  }

  // === 使用更稳定的选择器查找元素 ===
  function findRelativeTimeElements() {
    // 尝试多个选择器，优先使用文件列表区域的时间元素
    let elements = $('div[role="rowgroup"] relative-time[datetime]');

    // 如果文件列表区域没找到，尝试查找整个页面的时间元素
    if (elements.length === 0) {
      elements = $('relative-time[datetime]');
    }

    return elements;
  }

  function findDirectoryRows() {
    // 查找文件列表行，使用更通用的选择器
    return $('div[role="rowgroup"] div[role="row"]');
  }

  // === 核心函数 ===
  function GitHub_freshscanSearchPage(theme = THEME) {
    console.log('[GitHub freshscan] 执行搜索页面处理');

    // 搜索页面使用 title 属性中的时间信息
    // 选择器：div.prc-Truncate-Truncate-A9Wn6[title*="GMT"] 或 span[title*="GMT"]
    const timeElements = $('div.prc-Truncate-Truncate-A9Wn6[title*="GMT"], span.Text__StyledText-sc-1klmep6-0[title*="GMT"]');

    console.log(`[GitHub freshscan] 搜索页面找到 ${timeElements.length} 个时间元素`);

    if (timeElements.length === 0) {
      console.warn('[GitHub freshscan] 搜索页面未找到时间元素');
      return;
    }

    timeElements.each(function () {
      const $timeElement = $(this);
      const element = this;
      const titleAttr = $timeElement.attr('title');
      if (!titleAttr) return;

      const timeDate = parseSearchPageTime(titleAttr);
      if (!timeDate) {
        console.warn('[GitHub fresh] 无法解析时间:', titleAttr);
        return;
      }

      const timeResult = handelTime(timeDate.toISOString(), theme.TIME_BOUNDARY);
      const expectedStatus = timeResult ? STATUS_ACTIVE : STATUS_STALE;

      // 查找搜索结果项的容器 - 向上查找到搜索结果项
      let BGC_element = $timeElement.closest('div[data-testid="results-list"] > div').first();

      if (BGC_element.length === 0) {
        // 备选：查找包含搜索结果的父容器
        BGC_element = $timeElement.closest('li.Box-sc-g0xbh4-0');
      }

      if (BGC_element.length === 0) {
        // 最后的 fallback：查找最近的搜索结果容器
        const searchResultItem = $timeElement.closest('div').filter(function() {
          return $(this).find('h3').length > 0 || $(this).find('a[href*="github.com"]').length > 0;
        }).first();

        if (searchResultItem.length > 0) {
          BGC_element = searchResultItem;
        }
      }

      const containerStatus = BGC_element.length > 0 ? BGC_element.attr(STATUS_ATTR) : null;
      const currentStatus = $timeElement.attr(STATUS_ATTR);

      let needsUpdate = !processedElements.has(element) || currentStatus !== expectedStatus || containerStatus !== expectedStatus;

      if (!needsUpdate && theme.BGC.isEnabled && BGC_element.length > 0) {
        const expectedBg = normalizeColorValue(timeResult ? theme.BGC.highlightColor : theme.BGC.greyColor);
        const currentBg = BGC_element.css('background-color');
        if (expectedBg && currentBg !== expectedBg) {
          needsUpdate = true;
        }
      }

      if (!needsUpdate && theme.TIME_FORMAT.isEnabled) {
        const formattedSpan = $timeElement.find(`span[${TIME_SPAN_ATTR}="true"]`).first();
        if (formattedSpan.length === 0) {
          needsUpdate = true;
        }
      }

      if (!needsUpdate) {
        return;
      }

      processedElements.add(element);

      console.log(`[GitHub freshs can] 处理时间元素:`, {
        time: titleAttr,
        parsed: timeDate.toISOString(),
        timeResult,
        containerFound: BGC_element.length > 0
      });

      // 背景色 - 应用到整个搜索结果项
      if (BGC_element.length > 0) {
        setElementBGC(BGC_element, theme.BGC, timeResult);
        BGC_element.attr(STATUS_ATTR, expectedStatus);
      }

      // 字体颜色 - 应用到时间元素本身
      setElementFONT($timeElement, theme.FONT, timeResult);

      // 时间格式化（可选）
      if (theme.TIME_FORMAT.isEnabled && timeDate) {
        const formattedDate = DateTime.fromJSDate(timeDate).toFormat('yyyy-MM-dd');
        const firstSpan = $timeElement.find('span').first();
        if (firstSpan.length > 0) {
          firstSpan.text(formattedDate);
          firstSpan.attr(TIME_SPAN_ATTR, 'true');
        } else {
          $timeElement.text(formattedDate);
        }
      }

      $timeElement.attr(STATUS_ATTR, expectedStatus);
    });

    console.log(`[GitHub freshscan] 搜索页面处理完成，共处理 ${timeElements.length} 个元素`);
  }

  function GitHub_freshscanReposPage(theme = THEME) {
    // Repositories 列表页面的选择器
    const elements = $('relative-time[datetime]');
    if (elements.length === 0) return

    elements.each(function () {
      const $timeElement = $(this);
      const datetime = $timeElement.attr('datetime');
      if (!datetime || !isValidDatetime(datetime)) {
        return;
      }

      const element = this;
      const timeResult = handelTime(datetime, theme.TIME_BOUNDARY);
      const expectedStatus = timeResult ? STATUS_ACTIVE : STATUS_STALE;

      const repoItem = $timeElement.closest('div[id^="user-repositories-list"]').length > 0
        ? $timeElement.closest('li')
        : $timeElement.closest('div');

      const repoStatus = repoItem.length > 0 ? repoItem.attr(STATUS_ATTR) : null;
      const currentStatus = $timeElement.attr(STATUS_ATTR);

      let needsUpdate = !processedElements.has(element) || currentStatus !== expectedStatus || repoStatus !== expectedStatus;

      if (!needsUpdate && theme.BGC.isEnabled && repoItem.length > 0) {
        const expectedBg = normalizeColorValue(timeResult ? theme.BGC.highlightColor : theme.BGC.greyColor);
        const currentBg = repoItem.css('background-color');
        if (expectedBg && currentBg !== expectedBg) {
          needsUpdate = true;
        }
      }

      if (!needsUpdate && theme.TIME_FORMAT.isEnabled) {
        const formattedSpan = $timeElement.prev(`span[${TIME_SPAN_ATTR}="true"]`);
        if (formattedSpan.length === 0) {
          needsUpdate = true;
        }
      }

      if (!needsUpdate) {
        return;
      }

      processedElements.add(element);

      // 背景色 - 应用到整个仓库项
      if (repoItem.length > 0) {
        if (theme.BGC.isEnabled) {
          if (timeResult) {
            repoItem[0].style.setProperty('background-color', theme.BGC.highlightColor, 'important');
          } else {
            repoItem[0].style.setProperty('background-color', theme.BGC.greyColor, 'important');
          }
        }
        repoItem.attr(STATUS_ATTR, expectedStatus);
      }

      // 字体颜色
      setElementFONT($timeElement, theme.FONT, timeResult);

      // 时间格式化
      setElementTIME_FORMAT($timeElement, theme.TIME_FORMAT, datetime);

      $timeElement.attr(STATUS_ATTR, expectedStatus);
    })
  }

  function GitHub_freshscanAwesome(theme = THEME) {
    // 选择符合条件的 <a> 标签 - 使用更稳定的选择器
    let elementsToObserve = [];
    $('a[href*="github.com"]').each(function () {
      let href = $(this).attr('href');
      // 只处理符合 href 条件的 <a> 标签
      if (isValidHref(href)) {
        elementsToObserve.push(this); // 存储符合条件的元素
      }
    });

    // 使用 IntersectionObserver 监听元素是否进入/离开视口
    const observer = new IntersectionObserver(function (entries, observer) {
      entries.forEach(el => {
        const href = $(el.target).attr('href');
        const apiHref = toAPIUrl(href)
        if (el.isIntersecting && el.target.getAttribute('request') !== 'true' && apiHref) {
          $.ajax({
            url: apiHref, // API 地址
            method: 'GET', // 请求方式
            headers: {
              'Authorization': `token ${AWESOME_TOKEN}` || ''  // 替换为你的个人访问令牌
            },
            success: function (data) {
              const stars = data.stargazers_count; // 获取星标数
              const time = data.updated_at; // 获取星标数
              const timeResult = handelTime(time, theme.TIME_BOUNDARY);
              // 添加标签
              if (theme.AWESOME.isEnabled && el.target.getAttribute('request') !== 'true') {
                $(el.target).after(`<span class="stars" style="padding: 8px">★${stars}</span><span class="updated-at">📅${formatDate(time)}</span>`);
                el.target.setAttribute('request', 'true')
              }
              setElementBGC($(el.target), theme.BGC, timeResult)
              // 字体颜色
              setElementFONT($(el.target), theme.FONT, timeResult)
              $(el.target).css('padding', '0 12px')
            },
            error: function (err) {
              if (err.status === 403) {
                Swal.fire({
                  position: 'top-center',
                  icon: 'warning',
                  title: '检测到AWESOME API 速率限制超出！',
                  confirmButtonText: '查看详情',
                  showConfirmButton: true,
                  background: '#4ab96f',
                  preConfirm: () => {
                    window.open("https://home.rational-stars.top/", "_blank")
                  }
                })
              }
            }
          });

        } else {
          // console.log('元素离开视口:', href);
        }
      });
    }, { threshold: 0.5 }); // 当元素至少 50% 进入视口时触发回调
    // 开始监听所有符合条件的元素
    elementsToObserve.forEach(function (el) {
      observer.observe(el);
    });

  }

  function GitHub_freshscan(theme = THEME) {
    // 防止重复执行
    if (isProcessing) {
      return;
    }
    isProcessing = true;

    try {
      const matchUrl = isMatchedUrl()
      if (!matchUrl) return
      if (matchUrl === 'matchSearchPage') return GitHub_freshscanSearchPage(theme)
      if (matchUrl === 'matchReposPage') return GitHub_freshscanReposPage(theme)

      // 使用更稳定的选择器查找时间元素
      const elements = findRelativeTimeElements();
      if (elements.length === 0) {
        return;
      }

      let trRows = []
      let newElementsFound = false;

      elements.each(function () {
        const $timeElement = $(this);
        const datetime = $timeElement.attr('datetime');
        if (!datetime || !isValidDatetime(datetime)) {
          return;
        }

        const element = this;
        const timeResult = handelTime(datetime, theme.TIME_BOUNDARY);
        const expectedStatus = timeResult ? STATUS_ACTIVE : STATUS_STALE;

        // 使用更通用的方式查找行容器
        let rowElement = $timeElement.closest('div[role="row"]');

        // 如果没找到 role="row"，尝试其他方式
        if (rowElement.length === 0) {
          rowElement = $timeElement.closest('tr');
        }

        const rowStatus = rowElement.length > 0 ? rowElement.attr(STATUS_ATTR) : null;
        const currentStatus = $timeElement.attr(STATUS_ATTR);

        let needsUpdate = !processedElements.has(element) || currentStatus !== expectedStatus || rowStatus !== expectedStatus;

        if (!needsUpdate && theme.BGC.isEnabled && rowElement.length > 0) {
          const expectedBg = normalizeColorValue(timeResult ? theme.BGC.highlightColor : theme.BGC.greyColor);
          const currentBg = rowElement.css('background-color');
          if (expectedBg && currentBg !== expectedBg) {
            needsUpdate = true;
          }
        }

        if (!needsUpdate && theme.TIME_FORMAT.isEnabled) {
          const formattedSpan = $timeElement.prev(`span[${TIME_SPAN_ATTR}="true"]`);
          if (formattedSpan.length === 0) {
            needsUpdate = true;
          }
        }

        if (!needsUpdate) {
          return;
        }

        processedElements.add(element);
        newElementsFound = true;

        if (rowElement.length > 0) {
          if (!trRows.includes(rowElement[0])) {
            trRows.push(rowElement[0]);
          }

          // 背景色 - 应用到整行
          setElementBGC(rowElement, theme.BGC, timeResult);
          rowElement.attr(STATUS_ATTR, expectedStatus);

          // 查找文件夹和文件图标 SVG - 添加更多备用选择器
          let DIR_element = rowElement.find('svg[aria-label*="Directory"], svg[aria-label*="目录"]');
          let FILE_element = rowElement.find('svg[aria-label*="File"], svg[aria-label*="文件"]');

          // 如果没找到，尝试通过类名或其他属性查找
          if (DIR_element.length === 0 && FILE_element.length === 0) {
            DIR_element = rowElement.find('svg.octicon-file-directory');
            FILE_element = rowElement.find('svg.octicon-file');
          }

          // 文件夹颜色和文件图标
          setElementDIR(DIR_element, theme.DIR, timeResult);
          setElementDIR(FILE_element, theme.DIR, timeResult);
        }

        // 时间格式化
        setElementTIME_FORMAT($timeElement, theme.TIME_FORMAT, datetime);
        // 字体颜色
        setElementFONT($timeElement.parent(), theme.FONT, timeResult);
        $timeElement.attr(STATUS_ATTR, expectedStatus);
      });

      // 文件排序 - 只在有新元素时才排序
      if (newElementsFound && theme.SORT.isEnabled && trRows.length > 0) {
        // 暂停 MutationObserver
        if (mutationObserver) {
          mutationObserver.disconnect();
        }

        // 将行元素按日期排序
        trRows.sort((a, b) => {
          // 获取 datetime 属性
          let dateA = new Date($(a).find('relative-time').attr('datetime'));
          let dateB = new Date($(b).find('relative-time').attr('datetime'));
          // 根据 isAscending 变量控制排序顺序
          return theme.SORT.select === 'asc' ? dateA - dateB : dateB - dateA;
        });

        // 查找文件列表的容器
        let container = $('div[role="rowgroup"]').first();
        if (container.length === 0) {
          container = $('tbody').first();
        }

        if (container.length > 0) {
          container.append(trRows);
        }

        // 恢复 MutationObserver
        setTimeout(() => {
          if (mutationObserver) {
            const targetNode = document.querySelector('main') || document.body;
            mutationObserver.observe(targetNode, {
              childList: true,
              subtree: true
            });
          }
        }, 100);
      }

      if (theme.AWESOME.isEnabled && $('#repo-title-component a').text().toLowerCase().includes('awesome')) {
        GitHub_freshscanAwesome()
      }
    } finally {
      // 确保 isProcessing 标志被重置
      isProcessing = false;
    }
  }

  function formatDate(isoDateString) {
    return DateTime.fromISO(isoDateString).toFormat('yyyy-MM-dd');
  }

  // 解析搜索页面的时间格式 "Oct 15, 2025, 1:40 PM GMT+8"
  function parseSearchPageTime(timeString) {
    if (!timeString) return null;

    try {
      // GitHub 搜索页面使用的格式：Oct 15, 2025, 1:40 PM GMT+8
      // 移除 GMT+8 后缀，使用浏览器的 Date.parse
      const cleanedTime = timeString.replace(/\s*GMT[+-]\d+\s*$/, '').trim();
      const date = new Date(cleanedTime);

      if (!isNaN(date.getTime())) {
        return date;
      }

      // 如果失败，尝试使用 Luxon 解析
      const dt = DateTime.fromFormat(timeString, "MMM d, yyyy, h:mm a 'GMT'Z");
      if (dt.isValid) {
        return dt.toJSDate();
      }

      return null;
    } catch (e) {
      console.warn('[GitHub freshscan] 时间解析失败:', timeString, e);
      return null;
    }
  }

  // 验证 datetime 是否为有效的 ISO 日期格式
  function isValidDatetime(datetime) {
    if (!datetime) return false;
    // 检查是否为有效的 ISO 8601 格式
    const isoRegex = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/;
    if (!isoRegex.test(datetime)) return false;
    // 检查日期是否可以被正确解析
    const date = new Date(datetime);
    return !isNaN(date.getTime());
  }

  function isMatchedUrl() {
    const currentUrl = window.location.href

    // 判断是否符合仓库页面的 URL 模式
    const matchRepoPage =
      /^https:\/\/github\.com\/[^/]+\/[^/]+(?:\?.*)?$|^https:\/\/github\.com\/[^/]+\/[^/]+\/tree\/.+$/.test(
        currentUrl
      )
    // 判断是否符合搜索页面的 URL 模式
    const matchSearchPage = /^https:\/\/github\.com\/search\?.*$/.test(
      currentUrl
    )
    // 判断是否符合 repositories 列表页面 (用户或组织的仓库列表)
    const matchReposPage = /^https:\/\/github\.com\/[^/]+\?tab=repositories/.test(
      currentUrl
    ) || /^https:\/\/github\.com\/orgs\/[^/]+\?tab=repositories/.test(
      currentUrl
    )

    // 如果当前是 repositories 列表页面
    if (matchReposPage) return 'matchReposPage'

    // 如果当前是仓库页面，返回变量名
    if (matchRepoPage) return 'matchRepoPage'

    // 如果当前是搜索页面，返回变量名
    if (matchSearchPage) return 'matchSearchPage'

    // 如果没有匹配，返回 null 或空字符串
    return null
  }

  function debounce(func, wait) {
    let timeout;
    return function (...args) {
      clearTimeout(timeout);
      timeout = setTimeout(() => func.apply(this, args), wait);
    };
  }

  // 等待DOM完全加载的辅助函数
  function waitForElements(selector, callback, maxAttempts = 10, isSearchPage = false, timeoutCallback = null) {
    let attempts = 0;
    const checkInterval = setInterval(() => {
      const elements = $(selector);
      attempts++;

      // 检查是否找到有效的元素
      let hasValidElement = false;

      if (elements.length > 0) {
        // 对于搜索页面，检查 title 属性
        if (isSearchPage) {
          for (let i = 0; i < elements.length; i++) {
            const title = $(elements[i]).attr('title');
            if (title && title.includes('GMT')) {
              hasValidElement = true;
              break;
            }
          }
        } else {
          // 对于其他页面，检查 datetime 属性
          for (let i = 0; i < elements.length; i++) {
            const datetime = $(elements[i]).attr('datetime');
            if (datetime && isValidDatetime(datetime)) {
              hasValidElement = true;
              break;
            }
          }
        }
      }

      // 搜索页面和首次加载需要更多调试信息
      if (isSearchPage && attempts % 5 === 0) {
        console.log(`[GitHub freshscan] 等待元素... 尝试 ${attempts}/${maxAttempts}, 找到 ${elements.length} 个元素, 有效元素: ${hasValidElement}`);
      }

      if ((elements.length > 0 && hasValidElement) || attempts >= maxAttempts) {
        clearInterval(checkInterval);
        if (elements.length > 0 && hasValidElement) {
          console.log(`[GitHub freshscan] 找到有效元素，开始执行 (尝试 ${attempts} 次)`);
          callback();
        } else if (attempts >= maxAttempts) {
          console.log(`[GitHub freshscan] 达到最大尝试次数 (${maxAttempts}), 未找到有效元素`);
          // 调用兜底回调（如果提供）
          if (timeoutCallback) {
            timeoutCallback();
          }
        }
      }
    }, 200); // 每200ms检查一次
  }

  // 清除已处理元素的标记（在URL变化时调用）
  function resetProcessedElements() {
    processedElements = new WeakSet();
    isProcessing = false;
  }

  // 持久化智能轮询检查新元素
  function startPollingCheck() {
    // 清除之前的轮询
    if (pollingInterval) {
      clearInterval(pollingInterval);
    }

    let pollCount = 0;
    let successfulProcessCount = 0; // 成功处理元素的次数
    const matchedUrl = isMatchedUrl();
    const startTime = Date.now();

    const intelligentPoll = () => {
      pollCount++;
      const elapsedSeconds = (Date.now() - startTime) / 1000;

      let hasUnprocessed = false;
      let elementsFound = 0;

      // 根据页面类型使用不同的选择器
      if (matchedUrl === 'matchSearchPage') {
        // 搜索页面：检查 title 属性中的时间
        const elements = $('div.prc-Truncate-Truncate-A9Wn6[title*="GMT"], span.Text__StyledText-sc-1klmep6-0[title*="GMT"]');
        elementsFound = elements.length;
        elements.each(function() {
          const $timeElement = $(this);
          const title = $timeElement.attr('title');
          if (!title || !title.includes('GMT')) {
            return;
          }

          const timeDate = parseSearchPageTime(title);
          if (!timeDate) {
            return;
          }

          const timeResult = handelTime(timeDate.toISOString(), THEME.TIME_BOUNDARY);
          const expectedStatus = timeResult ? STATUS_ACTIVE : STATUS_STALE;
          const currentStatus = $timeElement.attr(STATUS_ATTR);

          // 查找容器并比对背景
          let container = $timeElement.closest('div[data-testid="results-list"] > div').first();
          if (container.length === 0) {
            container = $timeElement.closest('li.Box-sc-g0xbh4-0');
          }
          if (container.length === 0) {
            container = $timeElement.closest('div').filter(function() {
              return $(this).find('h3').length > 0 || $(this).find('a[href*="github.com"]').length > 0;
            }).first();
          }

          const containerStatus = container.length > 0 ? container.attr(STATUS_ATTR) : null;
          const formattedSpan = $timeElement.find(`span[${TIME_SPAN_ATTR}="true"]`).first();

          let needsUpdate = !processedElements.has(this) || currentStatus !== expectedStatus || containerStatus !== expectedStatus;

          if (!needsUpdate && THEME.BGC.isEnabled && container.length > 0) {
            const expectedBg = normalizeColorValue(timeResult ? THEME.BGC.highlightColor : THEME.BGC.greyColor);
            const currentBg = container.css('background-color');
            if (expectedBg && currentBg !== expectedBg) {
              needsUpdate = true;
            }
          }

          if (!needsUpdate && THEME.TIME_FORMAT.isEnabled && formattedSpan.length === 0) {
            needsUpdate = true;
          }

          if (needsUpdate) {
            hasUnprocessed = true;
            return false;
          }
        });
      } else {
        // 仓库文件页或 Repositories 页面：检查 datetime 属性
        const elements = $('relative-time[datetime]');
        elementsFound = elements.length;
        elements.each(function() {
          const $timeElement = $(this);
          const datetime = $timeElement.attr('datetime');
          if (!datetime || !isValidDatetime(datetime)) {
            return;
          }

          const timeResult = handelTime(datetime, THEME.TIME_BOUNDARY);
          const expectedStatus = timeResult ? STATUS_ACTIVE : STATUS_STALE;

          const currentStatus = $timeElement.attr(STATUS_ATTR);

          let container = $timeElement.closest('div[role="row"]');
          if (container.length === 0) {
            container = $timeElement.closest('tr');
          }
          if (container.length === 0 && matchedUrl === 'matchReposPage') {
                container = $timeElement.closest('div[id^="user-repositories-list"]').length > 0
                  ? $timeElement.closest('li')
                  : $timeElement.closest('div');
          }

          const containerStatus = container.length > 0 ? container.attr(STATUS_ATTR) : null;
          const formattedSpan = $timeElement.prev(`span[${TIME_SPAN_ATTR}="true"]`);

          let needsUpdate = !processedElements.has(this) || currentStatus !== expectedStatus || containerStatus !== expectedStatus;

          if (!needsUpdate && THEME.BGC.isEnabled && container.length > 0) {
            const expectedBg = normalizeColorValue(timeResult ? THEME.BGC.highlightColor : THEME.BGC.greyColor);
            const currentBg = container.css('background-color');
            if (expectedBg && currentBg !== expectedBg) {
              needsUpdate = true;
            }
          }

          if (!needsUpdate && THEME.TIME_FORMAT.isEnabled && formattedSpan.length === 0) {
            needsUpdate = true;
          }

          if (needsUpdate) {
            hasUnprocessed = true;
            return false;
          }
        });
      }

      if (hasUnprocessed && !isProcessing) {
        console.log(`[GitHub freshscan] 智能轮询检测到新元素 (第 ${pollCount} 次, 已${elapsedSeconds.toFixed(1)}秒)`);
        GitHub_freshscan();
        successfulProcessCount++;

        // 如果连续3次成功处理了元素，说明页面已稳定，可以停止高频轮询
        if (successfulProcessCount >= 3 && elementsFound > 0) {
          console.log('[GitHub freshscan] 页面已稳定，停止智能轮询');
          clearInterval(pollingInterval);
          pollingInterval = null;
          return;
        }
      }

      // 智能调整轮询间隔
      let nextInterval;
      if (elapsedSeconds < 30) {
        nextInterval = 1000; // 前30秒：每1秒（高频）
      } else if (elapsedSeconds < 60) {
        nextInterval = 2000; // 30-60秒：每2秒（中频）
      } else {
        nextInterval = 5000; // 60秒后：每5秒（低频持久化）
      }

      // 重新设置下次轮询
      clearInterval(pollingInterval);
      pollingInterval = setTimeout(intelligentPoll, nextInterval);

      // 每10次轮询输出一次状态
      if (pollCount % 10 === 0) {
        console.log(`[GitHub freshscan] 持久化轮询进行中... (第 ${pollCount} 次, 已${elapsedSeconds.toFixed(1)}秒, 找到${elementsFound}个元素)`);
      }
    };

    // 启动智能轮询
    intelligentPoll();
  }

  const runScript = () => {
    const matchedUrl = isMatchedUrl();
    if (!matchedUrl) return;

    // 根据页面类型设置不同的等待策略
    let maxAttempts = 60; // 默认12秒（增加到60次）
    let isSearchOrRepos = false;
    let needsPolling = false;
    let selector = 'relative-time[datetime]'; // 默认选择器

    if (matchedUrl === 'matchSearchPage') {
      maxAttempts = 80; // 搜索页面等待16秒（从50增加到80）
      isSearchOrRepos = true;
      needsPolling = true;
      // 搜索页面使用新的选择器
      selector = 'div.prc-Truncate-Truncate-A9Wn6[title*="GMT"], span.Text__StyledText-sc-1klmep6-0[title*="GMT"]';
      console.log('[GitHub freshscan] 检测到搜索页面，使用扩展等待时间并启动轮询');
    } else if (matchedUrl === 'matchReposPage') {
      maxAttempts = 70; // Repositories 页面等待14秒（从40增加到70）
      isSearchOrRepos = true;
      needsPolling = true;
      console.log('[GitHub freshscan] 检测到 Repositories 页面，使用扩展等待时间并启动轮询');
    } else if (matchedUrl === 'matchRepoPage') {
      needsPolling = true;
      console.log('[GitHub freshscan] 检测到仓库文件页面，启动持久化轮询');
    }

    // 等待元素出现
    waitForElements(selector, () => {
      // 使用 requestAnimationFrame 确保在浏览器渲染后执行
      requestAnimationFrame(() => {
        setTimeout(() => {
          GitHub_freshscan();

          // 对于搜索页面和 repos 页面，启动轮询检查
          if (needsPolling) {
            startPollingCheck();
          }
        }, 100);
      });
    }, maxAttempts, isSearchOrRepos, () => {
      // 达到最大尝试次数后的兜底回调：强制启动持久化轮询
      console.log('[GitHub freshscan] waitForElements 超时，启动兜底持久化轮询');
      startPollingCheck();
    });
  };

  // 页面加载完成后执行
  window.addEventListener('load', () => {
    runScript();
  });

  // 监听页面是否从不可见切换到可见
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') {
      runScript();
    }
  });

  // 监听 pjax:end 事件，确保页面内容完全加载
  document.addEventListener('pjax:end', () => {
    resetProcessedElements();
    // 增加延迟时间，确保 datetime 属性已更新
    setTimeout(runScript, 500);
  });

  // 重写 history.pushState 和 history.replaceState 来处理 URL 变化
  (function (history) {
    const pushState = history.pushState;
    const replaceState = history.replaceState;

    // 监听 pushState 事件，确保 URL 变化时执行
    history.pushState = function (state, title, url) {
      pushState.apply(history, arguments);
      resetProcessedElements();
      // 增加延迟时间，确保 datetime 属性已更新
      setTimeout(runScript, 500);
    };

    // 监听 replaceState 事件，确保 URL 变化时执行
    history.replaceState = function (state, title, url) {
      replaceState.apply(history, arguments);
      // replaceState 通常不需要重置，因为页面内容可能没变
      // 只在 URL 真正改变时才执行
      if (url && url !== window.location.pathname + window.location.search) {
        resetProcessedElements();
        setTimeout(runScript, 500);
      }
    };

    // 监听浏览器的前进/后退按钮 (popstate)
    window.addEventListener('popstate', () => {
      resetProcessedElements();
      // 增加延迟时间，确保 datetime 属性已更新
      setTimeout(runScript, 600);
    });
  })(window.history);

  // 添加 MutationObserver 来监听 DOM 变化
  mutationObserver = new MutationObserver(debounce((mutations) => {
    // 检查变化是否与文件列表相关
    let shouldRun = false;
    for (const mutation of mutations) {
      // 检查节点新增
      if (mutation.addedNodes.length > 0) {
        for (const node of mutation.addedNodes) {
          if (node.nodeType === 1) { // Element node
            if (node.querySelector &&
                (node.querySelector('relative-time[datetime]') ||
                 node.querySelector('div[role="row"]') ||
                 node.querySelector('div[title*="GMT"]') || // 搜索页面的时间元素
                 node.matches && (node.matches('relative-time[datetime]') ||
                                  node.matches('div[title*="GMT"]')))) {
              shouldRun = true;
              console.log('[GitHub freshscan] MutationObserver 检测到新增节点');
              break;
            }
          }
        }
      }

      // 检查属性变化（新增）
      if (mutation.type === 'attributes' && !shouldRun) {
        const target = mutation.target;
        // 检查是否是时间相关的属性变化
        if ((mutation.attributeName === 'datetime' && target.hasAttribute('datetime')) ||
            (mutation.attributeName === 'title' && target.hasAttribute('title') &&
             target.getAttribute('title').includes('GMT'))) {
          shouldRun = true;
          console.log('[GitHub freshscan] MutationObserver 检测到属性变化:', mutation.attributeName);
        }
      }

      if (shouldRun) break;
    }

    if (shouldRun && !isProcessing) {
      console.log('[GitHub freshscan] MutationObserver 触发脚本执行');
      runScript();
    }
  }, 300)); // 减少 debounce 延迟从 500ms 到 300ms

  // 开始观察 - 只观察主要内容区域，增加属性监听
  const targetNode = document.querySelector('main') || document.body;
  mutationObserver.observe(targetNode, {
    childList: true,
    subtree: true,
    attributes: true, // 新增：监听属性变化
    attributeFilter: ['datetime', 'title'] // 新增：只监听这两个属性
  });

  // === 初始化设置面板 ===
  // createSettingsPanel()

  // === 使用油猴菜单显示/隐藏设置面板 ===
  GM_registerMenuCommand('⚙️ 设置面板', createSettingsPanel)

  // 临时：重置配置到默认值
  GM_registerMenuCommand('🔄 重置为默认配置', () => {
    GM_setValue('config_JSON', JSON.stringify({ light: default_THEME, dark: default_THEME }))
    GM_setValue('CURRENT_THEME', 'light')
    GM_setValue('AWESOME_TOKEN', '')
    location.reload()
  })
  // 监听主题变化
  window
    .matchMedia('(prefers-color-scheme: dark)')
    .addEventListener('change', (e) => {
      if (e.matches) {
        THEME = config_JSON['dark']
        // console.log('系统切换到深色模式 🌙')
        GitHub_freshscan(THEME)
      } else {
        THEME = config_JSON['light']
        // console.log('系统切换到浅色模式 ☀️')
        GitHub_freshscan(THEME)
      }
    })

  // === 立即执行一次，解决首次加载不触发的问题 ===
  if (document.readyState === 'loading') {
    // 如果文档还在加载，等待 DOMContentLoaded
    document.addEventListener('DOMContentLoaded', () => {
      console.log('[GitHub freshscan] DOMContentLoaded 触发，执行脚本');
      runScript();

      // 针对首次加载添加额外的重试机制（因为 React 可能还在渲染）
      setTimeout(() => {
        console.log('[GitHub freshscan] 首次加载重试 (1秒后)');
        runScript();
      }, 1000);

      setTimeout(() => {
        console.log('[GitHub freshscan] 首次加载重试 (2秒后)');
        runScript();
      }, 2000);
    });
  } else {
    // 文档已经加载完成，立即执行
    console.log('[GitHub freshscan] 文档已加载，立即执行脚本');
    runScript();

    // 针对首次加载添加额外的重试机制（因为 React 可能还在渲染）
    setTimeout(() => {
      console.log('[GitHub freshscan] 首次加载重试 (500ms 后)');
      runScript();
    }, 500);

    setTimeout(() => {
      console.log('[GitHub freshscan] 首次加载重试 (1.5秒后)');
      runScript();
    }, 1500);
  }
})()
