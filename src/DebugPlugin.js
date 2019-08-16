const fs = require("fs");
const path = require("path");
const SingleEntryPlugin = require("webpack/lib/SingleEntryPlugin");
const MultiEntryPlugin = require("webpack/lib/MultiEntryPlugin");

// 处理入口文件（webpack 内置插件）
const itemToPlugin = (context, item, name) => {
  if(Array.isArray(item)) {
    return new MultiEntryPlugin(context, item, name);
  } else {
    return new SingleEntryPlugin(context, item, name);
  }
}

class DebugPlugin {
  /**
   * 构造函数
   * @param {Object: { enable = false } } options 配置对象
   *  @param enable 是否引入 vConsole
   */
  constructor(options) {
    this.options = Object.assign({}, { enable: false }, options);
  }

  /**
   * 向外暴露并调用的入口
   * @param {Object} compiler 启动时建立，整个编译生命周期都可以被访问到
   */
  apply(compiler) {
    compiler.hooks.entryOption.tap('vc-debug', (context, entry) => {
      const { enable } = this.options;
      let vConsolePath = path.resolve('debug-tool-webpack-plugin/src/vConsole.js');

      if (enable) {
        // vConsole 路径依据各自项目路径情况进行处理
        module.parent.paths.find(item => {
          let _vConsolePath = path.join(item, vConsolePath);
          if (fs.existsSync(item) && fs.existsSync(_vConsolePath)) {
            vConsolePath = _vConsolePath;
            return true;
          }
          return false
        })

        // 将 vConsole 添加到 entry 中
        if (typeof entry === 'string') {
          entry = [vConsolePath, entry];
        } else if (Array.isArray(entry)) {
          entry.unshift(vConsolePath);
        } else if (typeof entry === 'object') {
          entry['vConsole'] = vConsolePath;
        }

        // 使用 entryPlugin 重新解析 entry
        if (typeof entry === 'string' || Array.isArray(entry)) {
          itemToPlugin(context, entry, 'app').apply(compiler);
        } else if (typeof entry === 'object') {
          for (const name of Object.keys(entry)) {
            itemToPlugin(context, entry[name], name).apply(compiler);
          }
        }
        return true;
      }
    });
  }
}

module.exports = DebugPlugin;
