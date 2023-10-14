<div align="center">

<img src = 'https://cdn.jsdelivr.net/gh/fz6m/Private-picgo@moe-2021/img/20231014101905.jpg' width='100%' />

# ExBA

Blue Archive 风格图制作器

</div>

## Preview

<img src="https://cdn.jsdelivr.net/gh/fz6m/Private-picgo@moe-2021/img/20231014102319.jpg" width="45%" />

<details>
<summary>查看更多预览图</summary>
<img src="https://cdn.jsdelivr.net/gh/fz6m/Private-picgo@moe-2021/img/20231014102346.jpg" width="50%" /><img src="https://cdn.jsdelivr.net/gh/fz6m/Private-picgo@moe-2021/img/20231014102428.jpg" width="100%" />
</details>

## Directory

```yaml
 - mahiro    # mahiro 插件
 - node      # 核心逻辑
```

## Usage

### Install

```bash
  pnpm i
```

[mahiro](https://github.com/opq-osc/mahiro) 直接导入插件使用，其他渠道自行提取核心逻辑：

```ts
import { ExBA } from './mahiro'

// ...

mahiro.use(ExBA())
```

### Trigger

触发命令格式：

```bash
  ba 你不许玩 蔚蓝档案
  BA 手机里有一款 我不说是什么
```

## Troubleshooting

### `canvas` 依赖安装太慢

参考 [`.npmrc`](./.npmrc) 使用加速源：

```bash
# .npmrc
canvas_binary_host_mirror=https://registry.npmmirror.com/-/binary/canvas
```

### 字体加载失败 / 不高清

将字体安装到系统里再使用。

1. 移动 `node/src/assets/fonts/GlowSansSC-Normal-Heavy.otf` 与 `node/src/assets/fonts/R.otf` 两个字体文件到 `/usr/share/fonts/exba/*` 文件夹下。

2. 设定 CJK 兜底字体：

    ```bash
      sudo apt install fonts-noto-cjk fonts-noto-color-emoji
      sudo locale-gen zh_CN zh_CN.UTF-8
      sudo update-locale LC_ALL=zh_CN.UTF-8 LANG=zh_CN.UTF-8
    ```

3. 刷新字体缓存：

    ```bash
      fc-cache -fv
    ```

4. 修改 `node/src/draw.ts` 中的 `1` 处代码:

    ```diff
    - loadFonts()
    ```

5. 重启 mahiro ，再次尝试。

## Thanks / Inspiration

- [bluearchive-logo](https://github.com/nulla2011/bluearchive-logo)
