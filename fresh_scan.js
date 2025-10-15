// ==UserScript==
// @name         GitHub freshscan
// @namespace    http://tampermonkey.net/
// @version      1.0.0
// @description  通过颜色高亮的方式，帮助你快速判断一个 GitHub 仓库是否在更新。
// @author       https://github.com/CzsGit/github-fresh-scan 
// @license      Apache License 2.0
// @icon         https://raw.githubusercontent.com/rational-stars/picgo/refs/heads/main/avatar.jpg
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
  GM_addStyle(`@import url('https://cdn.jsdelivr.net/npm/@simonwep/pickr@1.9.1/dist/themes/classic.min.css');`)
  GM_addStyle(`
          .swal2-popup.swal2-modal.swal2-show{
          color: #FFF;
          border-radius: 20px;
          background: #31b96c;
          box-shadow:  8px 8px 16px #217e49,
          -8px -8px 16px #41f48f;
          #swal2-title a{
          display: inline-block;
          height: 40px;
          margin-right: 10px;
          border-radius: 10px;
          overflow: hidden;
          color: #fff;
          }
          #swal2-title {
          display: flex !important;
          justify-content: center;
          align-items: center;
          }
          .row-box select {
          border:unset;
          border-radius: .15em;
          }
          .row-box {
          display: flex;
          margin: 25px;
          align-items: center;
          justify-content: space-between;
          }
          .row-box .swal2-input {
          height: 40px;
          }
          .row-box label {
          margin-right: 10px;
          }
          .row-box main input{
          background: rgba(15, 172, 83, 1);
          }
          .row-box main {
          display: flex;
          align-items: center;
          }
          .row-box main input{
          width: 70px;
          border: unset;
          box-shadow: unset;
          text-align: right;
          margin:0;
          }
      `)
  const PanelDom = `
              <div class="row-box">
                  <label for="rpcPort">主题设置:</label>
                  <main>
                      <select tabindex="-1" id="THEME-select" class="swal2-input">
                          <option value="light">light</option>
                          <option value="dark">dark</option>
                      </select>
                  </main>
              </div>
              <div class="row-box">
                  <label id="TIME_BOUNDARY-label" for="rpcPort">时间阈值:</label>
                  <main>
                      <input id="TIME_BOUNDARY-number" type="number" class="swal2-input" value="" maxlength="3" pattern="\d{1,3}">
                      <select tabindex="-1" id="TIME_BOUNDARY-select" class="swal2-input">
                          <option value="day">日</option>
                          <option value="week">周</option>
                          <option value="month">月</option>
                          <option value="year">年</option>
                      </select>
                  </main>
              </div>
              <div class="row-box">
                  <div>
                      <label id="BGC-label">背景颜色:</label>
                      <input type="checkbox" id="BGC-enabled">
                  </div>
                  <main>
                      <span id="BGC-highlight-color-value">
                          <div id="BGC-highlight-color-pickr"></div>
                      </span>
                      <span id="BGC-grey-color-value">
                          <div id="BGC-grey-color-pickr"></div>
                      </span>
                  </main>
              </div>
              <div class="row-box">
                  <div>
                      <label id="FONT-label">字体颜色:</label>
                      <input type="checkbox" id="FONT-enabled">
                  </div>
                  <main>
                      <span id="FONT-highlight-color-value">
                          <div id="FONT-highlight-color-pickr"></div>
                      </span>
                      <span id="FONT-grey-color-value">
                          <div id="FONT-grey-color-pickr"></div>
                      </span>
                  </main>
              </div>

              <div class="row-box">
                  <div>
                      <label id="DIR-label">文件夹颜色:</label>
                      <input type="checkbox" id="DIR-enabled">
                  </div>
                  <main>
                      <span id="DIR-highlight-color-value">
                          <div id="DIR-highlight-color-pickr"></div>
                      </span>
                      <span id="DIR-grey-color-value">
                          <div id="DIR-grey-color-pickr"></div>
                      </span>
                  </main>
              </div>
              <div class="row-box">
                  <div>
                      <label id="TIME_FORMAT-label">时间格式化:</label>
                      <input type="checkbox" id="TIME_FORMAT-enabled">
                  </div>
              </div>
              <div class="row-box">
                   <div>
                      <label id="SORT-label">文件排序:</label>
                      <input type="checkbox" id="SORT-enabled">
                  </div>
                  <main>
                      <select tabindex="-1" id="SORT-select" class="swal2-input">
                          <option value="asc">时间正序</option>
                          <option value="desc">时间倒序</option>
                      </select>
                  </main>
              </div>

              <div class="row-box">
                  <label for="rpcPort">当前主题:</label>
                  <main>
                      <select tabindex="-1" id="CURRENT_THEME-select" class="swal2-input">
                          <option value="auto">auto</option>
                          <option value="light">light</option>
                          <option value="dark">dark</option>
                      </select>
                  </main>
              </div>

              <div class="row-box">
                  <div>
                      <label id="AWESOME-label"><a target="_blank" href="https://github.com/settings/tokens">AWESOME token: </a></label>
                      <input type="checkbox" id="AWESOME-enabled">
                  </div>
                  <main>
                      <input id="AWESOME_TOKEN" type="password" class="swal2-input" value="">
                  </main>
              </div>
            <p>当复选框切换到未勾选状态时，部分设置不会立即生效需重新刷新页面。AWESOME谨慎开启详细说明请看 <a target="_blank" href="https://docs.rational-stars.top/diy-settings/awesome-xxx.html"> 文档ℹ️</><p/>

          `
  // === 配置项 ===
  let default_THEME = {
    BGC: {
      highlightColor: 'rgba(15, 172, 83, 1)', // 高亮颜色（示例：金色）
      greyColor: 'rgba(245, 245, 245, 0.24)', // 灰色（示例：深灰）
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
      isEnabled: true, // 是否启用排序
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
    theme: 'monolith', // 使用经典主题
    components: {
      preview: true,
      opacity: true,
      hue: true,
      interaction: {
        rgba: true,
        // hex: true,
        // hsla: true,
        // hsva: true,
        // cmyk: true,
        input: true,
        clear: true,
        save: true,
      },
    },
  }
  function getThemeType() {
    let themeType = CURRENT_THEME
    if (CURRENT_THEME === 'auto') {
      if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
        // console.log('当前系统是深色模式 🌙')
        themeType = 'dark'
      } else {
        // console.log('当前系统是浅色模式 ☀️')
        themeType = 'light'
      }
    }
    window.console.log("%c✅向前：" + "如果您觉得GitHub-freshscan好用，点击下方 github链接 给个 star 吧。非常感谢你！！！\n[https://github.com/CzsGit/github-fresh-scan]", "color:green")
    return themeType
  }
  function initPickr(el_default) {
    const pickr = Pickr.create({ ...configPickr, ...el_default })
    watchPickr(pickr)
  }
  function watchPickr(pickrName, el) {
    pickrName.on('save', (color, instance) => {
      pickrName.hide()
    })
  }
  const preConfirm = () => {
    // 遍历默认主题配置，更新设置
    const updated_THEME = getUpdatedThemeConfig(default_THEME)
    CURRENT_THEME = $('#CURRENT_THEME-select').val()
    AWESOME_TOKEN = $('#AWESOME_TOKEN').val()
    // 保存到油猴存储
    GM_setValue(
      'config_JSON',
      JSON.stringify({
        ...config_JSON,
        [$('#THEME-select').val()]: updated_THEME,
      })
    )
    GM_setValue('CURRENT_THEME', CURRENT_THEME)
    GM_setValue('AWESOME_TOKEN', AWESOME_TOKEN)
    THEME = updated_THEME // 更新当前主题
    GitHub_freshscan(updated_THEME)
    Swal.fire({
      position: 'top-center',
      background: '#4ab96f',
      icon: 'success',
      title: '设置已保存',
      showConfirmButton: false,
      timer: 800,
    })
  }
  function initSettings(theme) {
    initPickr({
      el: '#BGC-highlight-color-pickr',
      default: theme.BGC.highlightColor,
    })
    initPickr({ el: '#BGC-grey-color-pickr', default: theme.BGC.greyColor })
    initPickr({
      el: '#FONT-highlight-color-pickr',
      default: theme.FONT.highlightColor,
    })
    initPickr({ el: '#FONT-grey-color-pickr', default: theme.FONT.greyColor })
    initPickr({
      el: '#DIR-highlight-color-pickr',
      default: theme.DIR.highlightColor,
    })
    initPickr({ el: '#DIR-grey-color-pickr', default: theme.DIR.greyColor })
    $('#THEME-select').val(getThemeType())
    $('#CURRENT_THEME-select').val(CURRENT_THEME)
    $('#AWESOME_TOKEN').val(AWESOME_TOKEN)
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
            // 获取高亮颜色（示例：金色、道奇蓝等）
            val = $(`#${themeKey}-highlight-color-value .pcr-button`).css(
              '--pcr-color'
            )
            break
          case 'greyColor':
            // 获取灰色调（示例：深灰、标准灰、暗灰等）
            val = $(`#${themeKey}-grey-color-value .pcr-button`).css(
              '--pcr-color'
            )
            break
          case 'isEnabled':
            // 判断该主题项是否启用
            val = $(`#${themeKey}-enabled`).prop('checked')
            break
          case 'number':
            // 获取时间阈值（示例：30）
            val = $(`#${themeKey}-number`).val()
            break
          case 'select':
            // 获取时间单位（可能的值："day", "week", "month"）
            val = $(`#${themeKey}-select`).val()
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
            $(`#${themeKey}-highlight-color-value .pcr-button`).css(
              '--pcr-color',
              val
            )
            break
          case 'greyColor':
            $(`#${themeKey}-grey-color-value .pcr-button`).css(
              '--pcr-color',
              val
            )
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
      title: `<a target="_blank" tabindex="-1" id="swal2-title-div" href="https://home.rational-stars.top/"><img src="https://raw.githubusercontent.com/rational-stars/picgo/refs/heads/main/avatar.jpg" alt="向前" width="40"></a><a tabindex="-1" target="_blank" href="https://github.com/CzsGit/github-fresh-scan">GitHub freshscan 设置</a>`,
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
    if (TIME_FORMAT.isEnabled && el.css('display') !== 'none') {
      el.css('display', 'none')
      const formattedDate = formatDate(datetime)
      el.before(`<span>${formattedDate}</span>`)
    } else if (TIME_FORMAT.isEnabled === false) {
      el.parent().find('span').remove()
      el.css('display', 'block')
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
      const element = this;
      const titleAttr = $(this).attr('title');

      // 检查是否已处理过
      if (processedElements.has(element)) {
        return;
      }

      if (!titleAttr) return;

      // 解析时间字符串（格式："Oct 15, 2025, 1:40 PM GMT+8"）
      const timeDate = parseSearchPageTime(titleAttr);

      if (!timeDate) {
        console.warn('[GitHub fresh] 无法解析时间:', titleAttr);
        return;
      }

      // 标记为已处理
      processedElements.add(element);

      // 判断时间是否在阈值内
      const timeResult = handelTime(timeDate.toISOString(), theme.TIME_BOUNDARY);

      // 查找搜索结果项的容器 - 向上查找到搜索结果项
      let BGC_element = $(this).closest('div[data-testid="results-list"] > div').first();

      if (BGC_element.length === 0) {
        // 备选：查找包含搜索结果的父容器
        BGC_element = $(this).closest('li.Box-sc-g0xbh4-0');
      }

      if (BGC_element.length === 0) {
        // 最后的 fallback：查找最近的搜索结果容器
        const searchResultItem = $(this).closest('div').filter(function() {
          return $(this).find('h3').length > 0 || $(this).find('a[href*="github.com"]').length > 0;
        }).first();

        if (searchResultItem.length > 0) {
          BGC_element = searchResultItem;
        }
      }

      console.log(`[GitHub freshs can] 处理时间元素:`, {
        time: titleAttr,
        parsed: timeDate.toISOString(),
        timeResult,
        containerFound: BGC_element.length > 0
      });

      // 背景色 - 应用到整个搜索结果项
      if (BGC_element.length > 0) {
        setElementBGC(BGC_element, theme.BGC, timeResult);
      }

      // 字体颜色 - 应用到时间元素本身
      setElementFONT($(this), theme.FONT, timeResult);

      // 时间格式化（可选）
      if (theme.TIME_FORMAT.isEnabled && timeDate) {
        const formattedDate = DateTime.fromJSDate(timeDate).toFormat('yyyy-MM-dd');
        // 只修改显示的文本，保留 title 属性
        $(this).find('span').first().text(formattedDate);
      }
    });

    console.log(`[GitHub freshscan] 搜索页面处理完成，共处理 ${timeElements.length} 个元素`);
  }

  function GitHub_freshscanReposPage(theme = THEME) {
    // Repositories 列表页面的选择器
    const elements = $('relative-time[datetime]');
    if (elements.length === 0) return

    elements.each(function () {
      const datetime = $(this).attr('datetime');
      const element = this;

      // 检查是否已处理过
      if (processedElements.has(element)) {
        return;
      }

      // 验证 datetime 是否有效
      if (datetime && isValidDatetime(datetime)) {
        // 标记为已处理
        processedElements.add(element);

        const timeResult = handelTime(datetime, theme.TIME_BOUNDARY);

        // 查找仓库项的父容器
        const repoItem = $(this).closest('div[id^="user-repositories-list"]').length > 0
          ? $(this).closest('li')
          : $(this).closest('div');

        // 背景色 - 应用到整个仓库项
        if (repoItem.length > 0 && theme.BGC.isEnabled) {
          if (timeResult) {
            repoItem[0].style.setProperty('background-color', theme.BGC.highlightColor, 'important');
          } else {
            repoItem[0].style.setProperty('background-color', theme.BGC.greyColor, 'important');
          }
        }

        // 字体颜色
        setElementFONT($(this), theme.FONT, timeResult);

        // 时间格式化
        if (theme.TIME_FORMAT.isEnabled) {
          const formattedDate = formatDate(datetime);
          $(this).text(formattedDate);
        }
      }
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

      elements.each(function (index) {
        const datetime = $(this).attr('datetime')
        const element = this;

        // 检查是否已处理过
        if (processedElements.has(element)) {
          return; // 跳过已处理的元素
        }

        // 验证 datetime 是否有效
        if (datetime && isValidDatetime(datetime)) {
          // 标记为已处理
          processedElements.add(element);
          newElementsFound = true;

          const timeResult = handelTime(datetime, theme.TIME_BOUNDARY)

          // 使用更通用的方式查找行容器
          let rowElement = $(this).closest('div[role="row"]');

          // 如果没找到 role="row"，尝试其他方式
          if (rowElement.length === 0) {
            rowElement = $(this).closest('tr');
          }

          if (rowElement.length > 0) {
            trRows.push(rowElement[0])
          }

          // 背景颜色和字体 - 尝试多种选择器
          let BGC_element = $(this).closest('div[role="gridcell"]');
          if (BGC_element.length === 0) {
            BGC_element = $(this).closest('td');
          }
          if (BGC_element.length === 0) {
            BGC_element = $(this).parent();
          }

          // 查找文件夹和文件图标 SVG - 添加更多备用选择器
          let DIR_element = rowElement.find('svg[aria-label*="Directory"], svg[aria-label*="目录"]');
          let FILE_element = rowElement.find('svg[aria-label*="File"], svg[aria-label*="文件"]');

          // 如果没找到，尝试通过类名或其他属性查找
          if (DIR_element.length === 0 && FILE_element.length === 0) {
            DIR_element = rowElement.find('svg.octicon-file-directory');
            FILE_element = rowElement.find('svg.octicon-file');
          }

          // 背景色
          setElementBGC(BGC_element, theme.BGC, timeResult)
          // 文件夹颜色和文件图标
          setElementDIR(DIR_element, theme.DIR, timeResult)
          setElementDIR(FILE_element, theme.DIR, timeResult)
          // 时间格式化
          setElementTIME_FORMAT($(this), theme.TIME_FORMAT, datetime)
          // 字体颜色
          setElementFONT($(this).parent(), theme.FONT, timeResult)
        }
      })

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
  function waitForElements(selector, callback, maxAttempts = 10, isSearchPage = false) {
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
        }
      }
    }, 200); // 每200ms检查一次
  }

  // 清除已处理元素的标记（在URL变化时调用）
  function resetProcessedElements() {
    processedElements = new WeakSet();
    isProcessing = false;
  }

  // 轮询检查新元素（用于搜索页面和首次加载）
  function startPollingCheck() {
    // 清除之前的轮询
    if (pollingInterval) {
      clearInterval(pollingInterval);
    }

    let pollCount = 0;
    const maxPolls = 15; // 最多轮询15次（15秒）
    const matchedUrl = isMatchedUrl();

    pollingInterval = setInterval(() => {
      pollCount++;

      let hasUnprocessed = false;

      // 根据页面类型使用不同的选择器
      if (matchedUrl === 'matchSearchPage') {
        // 搜索页面：检查 title 属性中的时间
        const elements = $('div.prc-Truncate-Truncate-A9Wn6[title*="GMT"], span.Text__StyledText-sc-1klmep6-0[title*="GMT"]');
        elements.each(function() {
          const title = $(this).attr('title');
          if (title && title.includes('GMT') && !processedElements.has(this)) {
            hasUnprocessed = true;
            return false; // 跳出循环
          }
        });
      } else {
        // 其他页面：检查 datetime 属性
        const elements = $('relative-time[datetime]');
        elements.each(function() {
          const datetime = $(this).attr('datetime');
          if (datetime && isValidDatetime(datetime) && !processedElements.has(this)) {
            hasUnprocessed = true;
            return false; // 跳出循环
          }
        });
      }

      if (hasUnprocessed && !isProcessing) {
        console.log(`[GitHub freshscan] 轮询检测到新元素 (轮询 ${pollCount}/${maxPolls})`);
        GitHub_freshscan();
      }

      // 达到最大轮询次数后停止
      if (pollCount >= maxPolls) {
        console.log('[GitHub freshscan] 轮询检查结束');
        clearInterval(pollingInterval);
        pollingInterval = null;
      }
    }, 1000); // 每秒检查一次
  }

  const runScript = () => {
    const matchedUrl = isMatchedUrl();
    if (!matchedUrl) return;

    // 根据页面类型设置不同的等待策略
    let maxAttempts = 30; // 默认6秒
    let isSearchOrRepos = false;
    let needsPolling = false;
    let selector = 'relative-time[datetime]'; // 默认选择器

    if (matchedUrl === 'matchSearchPage') {
      maxAttempts = 50; // 搜索页面等待10秒
      isSearchOrRepos = true;
      needsPolling = true;
      // 搜索页面使用新的选择器
      selector = 'div.prc-Truncate-Truncate-A9Wn6[title*="GMT"], span.Text__StyledText-sc-1klmep6-0[title*="GMT"]';
      console.log('[GitHub freshscan] 检测到搜索页面，使用扩展等待时间并启动轮询');
    } else if (matchedUrl === 'matchReposPage') {
      maxAttempts = 40; // Repositories 页面等待8秒
      isSearchOrRepos = true;
      needsPolling = true;
      console.log('[GitHub freshscan] 检测到 Repositories 页面，使用扩展等待时间并启动轮询');
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
    }, maxAttempts, isSearchOrRepos);
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
      // 检查是否有添加了 relative-time 或文件列表相关的节点
      if (mutation.addedNodes.length > 0) {
        for (const node of mutation.addedNodes) {
          if (node.nodeType === 1) { // Element node
            if (node.querySelector &&
                (node.querySelector('relative-time[datetime]') ||
                 node.querySelector('div[role="row"]') ||
                 node.matches && node.matches('relative-time[datetime]'))) {
              shouldRun = true;
              break;
            }
          }
        }
      }
      if (shouldRun) break;
    }

    if (shouldRun && !isProcessing) {
      console.log('[GitHub freshscan] MutationObserver 检测到 DOM 变化，执行脚本');
      runScript();
    }
  }, 300)); // 减少 debounce 延迟从 500ms 到 300ms

  // 开始观察 - 只观察主要内容区域
  const targetNode = document.querySelector('main') || document.body;
  mutationObserver.observe(targetNode, {
    childList: true,
    subtree: true
  });

  // === 初始化设置面板 ===
  // createSettingsPanel()

  // === 使用油猴菜单显示/隐藏设置面板 ===
  GM_registerMenuCommand('⚙️ 设置面板', createSettingsPanel)
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
