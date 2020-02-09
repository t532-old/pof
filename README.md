![pof.js](docs/.vuepress/public/header.jpg)

> **Note that this is a work in progress.**

```sh
npm install --save pofjs
```

## 简介

**pof.js** 是又一个基于 酷Q 的轻量 QQ 机器人框架。 

这不是一个重量级的框架，它的配置项很少，自由度很高，没有模块化系统、帮助系统或很强的命令系统。

这是一次新的尝试：试着用尽可能容易理解的，强类型的，函数式的方法解决问题。

- 新的消息处理方式：通过组合经过简单包装的异步函数（`Step`s），实现高效的模式匹配。
- 对于 TypeScripters：Well-typed。你不大可能被迫使用 `any`（除非有些东西确实应该是 `any` ...）。
- 支持基于异步消息流的会话（和 Ion.js 很相似，但经过简化），支持中间件。
- 只有，两个，依赖。
- 只支持通过同步 HTTP 方式与 CQHTTP 通信。~~觉得慢就不要用了~~

## Roadmap
- [ ] `Receive` - Well-typed receiver
    - [x] Types
    - [x] Server
    - [ ] Tests
- [ ] `Send` - Well-typed sender
    - [x] Types
    - [x] Client
    - [x] Template Send API
    - [ ] Tests
- [ ] `Code` - Util functions for dealing w/ CQCodes
    - [x] Implementation
    - [ ] Tests
- [ ] `Step` - Kleisli arrows w/ useful methods
    - [x] Implementation
    - [ ] Tests
- [ ] `Mw` - Middlewares
    - [x] Implementation
    - [ ] Tests
- [ ] `App` - Application-level functionalities
    - [x] `match()`
    - [ ] Tests
- [ ] `Session` - Message Stream & Session manager
    - [x] borrow from Ion.js (not copy)
    - [x] proper time limits and max attempts limits
    - [ ] Tests
- [ ] `Prelude` - 4 Sets of `Step`s with basic message parsing mechanics
    - [ ] `content` - parse string content
    - [ ] `sieve` - parse rich content (`Code`s)
    - [ ] `command` - parse command-formatted content (much weaker than that of [Koishi](https://npm.im/koishi)'s)
    - [ ] `origin` - parse sender info
    - [ ] Tests

## 贡献

热烈欢迎 Stars、PRs、Issues。

> Code Copyright 2020 [t532](https://github.com/t532) *
> Distributed under [MIT License](https://github.com/t532/pof/blob/master/LICENSE).

> Logo & Illust. Copyright 2020 [ユみこ](https://github.com/t532) *
> Distributed under [CreativeCommons-Attributes (CC-BY) 4.0 License](http://creativecommons.org/licenses/by/4.0/).
