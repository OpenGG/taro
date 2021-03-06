import * as autoprefixer from 'autoprefixer';
import * as path from 'path';
import * as modules from 'postcss-modules';
import * as constparse from 'postcss-plugin-constparse';
import * as pxtransform from 'postcss-pxtransform';
import { sync as resolveSync } from 'resolve';
import { isNpmPackage, appPath } from '../util';

import { PostcssOption } from '../util/types';

const defaultAutoprefixerOption = {
  enable: true,
  config: {
    browsers: [
      'Android >= 4',
      'iOS >= 6'
    ],
    flexbox: 'no-2009'
  }
}
const defaultPxtransformOption: {
  [key: string]: any
} = {
  enable: true,
  config: {
    platform: 'h5'
  }
}
const defaultCssModulesOption = {
  enable: false,
  config: {
    generateScopedName: '[name]__[local]___[hash:base64:5]'
  }
}
const defaultConstparseOption = {
  constants: [{
    key: 'taro-tabbar-height',
    val: '50PX'
  }],
  platform: 'h5'
}

const optionsWithDefaults = ['autoprefixer', 'pxtransform', 'cssModules']

const plugins = [] as any[]

export const getPostcssPlugins = function ({
  designWidth,
  deviceRatio,
  postcssOption = {} as PostcssOption
}) {
  const autoprefixerOption = Object.assign({}, defaultAutoprefixerOption, postcssOption.autoprefixer)

  if (designWidth) {
    defaultPxtransformOption.config.designWidth = designWidth
  }

  if (deviceRatio) {
    defaultPxtransformOption.config.deviceRatio = deviceRatio
  }

  const pxtransformOption = Object.assign({}, defaultPxtransformOption, postcssOption.pxtransform)
  const cssModulesOption = Object.assign({}, defaultCssModulesOption, postcssOption.cssModules)

  if (autoprefixerOption.enable) {
    plugins.push(autoprefixer(autoprefixerOption as autoprefixer.Options))
  }

  if (pxtransformOption.enable) {
    defaultPxtransformOption.platform = defaultPxtransformOption.config.platform
    plugins.push(pxtransform(defaultPxtransformOption))
  }

  if (cssModulesOption.enable) {
    const customCssModulesOption = postcssOption.cssModules ? postcssOption.cssModules.config : {}
    plugins.push(modules(customCssModulesOption))
  }

  plugins.push(constparse(defaultConstparseOption))

  Object.entries(postcssOption).forEach(([pluginName, pluginOption]) => {
    if (optionsWithDefaults.indexOf(pluginName) > -1) return
    if (!pluginOption || !pluginOption.enable) return

    if (!isNpmPackage(pluginName)) { // local plugin
      pluginName = path.join(appPath, pluginName)
    }

    try {
      const pluginPath = resolveSync(pluginName, { basedir: appPath })
      plugins.push(require(pluginPath)(pluginOption.config || {}))
    } catch (e) {
      const msg = e.code === 'MODULE_NOT_FOUND' ? `缺少postcss插件${pluginName}, 已忽略` : e
      console.log(msg)
    }
  })

  return plugins
}
