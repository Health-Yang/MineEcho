# MineEcho 发布传播包

这份文档用于把 MineEcho 发到 V2EX、掘金、开源中国、即刻、朋友圈、X、Reddit、Hacker News 等渠道。发布时建议只承诺当前已经实现的能力，不把路线图写成已完成能力。

## 一句话定位

MineEcho 是一个本地优先的个人 AI 助手 Memory OS，把长期记忆、Wiki++ 知识库、Skill/AI 应用路由和 TokenLess 上下文压缩串成一个可长期运行的助手框架。

## 中文短介绍

我开源了 MineEcho，一个本地优先的个人 AI 助手框架。它不是单纯聊天界面，而是围绕“记-学-用-省”做了一个闭环：用 L0-L3 记忆树记住用户说过什么和做过什么，用 Wiki++ 知识库组织外部资料和知识图谱，用 skill 路由把本地技能和外部 AI 应用统一调用，再用 TokenLess 对命令输出、文档抽取和工具结果做场景化压缩，降低长期使用的上下文成本。

项目地址：https://github.com/Health-Yang/MineEcho

## 英文短介绍

MineEcho is a source-available, local-first Memory OS for personal AI assistants. It connects durable memory, Wiki++ knowledge, skill/AI-app routing, and TokenLess context compression into one assistant loop.

Repository: https://github.com/Health-Yang/MineEcho

## V2EX / 掘金长帖草稿

标题建议：

- 我开源了 MineEcho：一个会记住你、学习知识、调用技能并节省上下文成本的个人 AI 助手框架
- MineEcho：把长期记忆、Wiki++ 知识库、AI 应用和 TokenLess 串起来的本地优先 AI 助手

正文：

大家好，我最近把一个基于 OpenClaw PI 框架能力二次开发的项目整理成了源码开放版本，名字叫 MineEcho。

我做它的出发点是：现在很多 AI 产品只解决一个局部问题。聊天界面通常不记得长期上下文；RAG 知识库能查资料，但不太会主动行动；Agent 框架能调用工具，但工具输出和日志很容易把上下文撑爆；企业 AI 应用平台又容易变成一堆孤立入口。

MineEcho 试图把这些能力串成一个闭环：

- 记：L0-L3 记忆树，把原始交互、日摘要、周摘要、月归档分层管理，并在用户提问时进行语义召回。
- 学：Wiki++ 知识库，把导入资料组织成 raw、wiki、chunk、graph、alignment 多层结构。
- 用：skill 和 AI 应用进入同一个注册表，用户提问时可以通过路由找到适合的能力。
- 省：TokenLess 对命令输出、文档抽取、URL 导入和工具结果做场景化压缩，保留错误、计数、关键行和头尾上下文。

目前它包含本地 Console、BFF、聊天、技能中心、知识库、知识图谱、我的记忆、会议辅助、模型配置和本地运行态数据隔离。项目还比较早期，适合对个人 AI 助手、长期记忆、知识图谱、AI 应用路由和本地优先 AI 框架感兴趣的朋友一起试用和提建议。

项目地址：https://github.com/Health-Yang/MineEcho

## 朋友圈 / 即刻版本

我把 MineEcho 整理成源码开放项目了。

它不是一个普通 AI 聊天壳，而是想做一个本地优先的个人 AI 助手底座：能记住用户长期上下文，能把资料沉淀成 Wiki++ 知识库和知识图谱，能把 skill 和外部 AI 应用统一路由，还能用 TokenLess 压缩工具输出和文档内容，减少长期使用时的 token 浪费。

感兴趣可以看看，也欢迎提 issue 或一起做 skill 生态。

https://github.com/Health-Yang/MineEcho

## X / Twitter 版本

I just released MineEcho, a source-available local-first Memory OS for personal AI assistants.

It connects:

- L0-L3 long-term memory
- Wiki++ knowledge and graph context
- skill and AI-app routing
- TokenLess context compression

Repo: https://github.com/Health-Yang/MineEcho

## Hacker News / Reddit 版本

Title:

Show HN: MineEcho, a local-first Memory OS for personal AI assistants

Post:

MineEcho is a source-available, local-first AI assistant framework focused on long-term personal context. It combines an L0-L3 memory tree, a Wiki++ knowledge layer, skill/AI-app routing, and a scenario-aware context compression layer called TokenLess.

The goal is to move beyond a stateless chat UI or a passive RAG store: MineEcho tries to make memory, knowledge, actions, and cost controls work as one loop.

Repository: https://github.com/Health-Yang/MineEcho

## Demo 录屏脚本

1. 打开 Console，展示初始化配置和模型 Provider 页面。
2. 在聊天页问一个和个人偏好或项目背景有关的问题。
3. 导入一份文档或 URL，展示 Wiki++ 知识库和知识图谱更新。
4. 导入或启用一个 skill / AI 应用，展示路由预览。
5. 再问一个需要结合旧记忆、知识库和 skill 的复杂问题。
6. 打开设置页 TokenLess 指标，展示 raw/reduced 字符数和估算节省 tokens。

## 发布检查清单

- GitHub README 首屏能在 20 秒内说明 MineEcho 是什么。
- repo description 不含旧名称。
- topics 已覆盖 AI、memory、RAG、agent、knowledge graph、local-first。
- 至少准备一张架构图或录屏。
- 发布帖只承诺当前能力，把未来方向标成 roadmap。
- 每次外部发布后，把高质量反馈转成 GitHub issue。
