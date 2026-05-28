; NSIS 安装脚本扩展
; 在安装完成后创建数据目录

!macro customInstall
  ; 创建用户数据目录
  CreateDirectory "$LOCALAPPDATA\MineEcho"
  CreateDirectory "$LOCALAPPDATA\MineEcho\knowledge"
  CreateDirectory "$LOCALAPPDATA\MineEcho\.mineecho"
!macroend

!macro customUnInstall
  ; 卸载时保留用户数据，仅删除程序文件
  MessageBox MB_YESNO "是否保留用户数据（知识库、配置等）？$\n$\n选择「是」保留数据，选择「否」删除所有数据。" IDYES keep_data IDNO remove_data
  remove_data:
    RMDir /r "$LOCALAPPDATA\MineEcho"
  keep_data:
!macroend
