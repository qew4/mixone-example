// @mainProcess
export async function readFile(path) {
    const content = await fs.readFile(path);
    return content;
}
// @mainProcess
export async function watchFile(path) {
    const content = await fs.readFile(path);
    fs.watch(path, () => {
      const newContent = fs.readFile(path);
      this.callback(newContent);  // 使用 this.callback
    });
    return content;
}
// @mainProcess
export async function getSystemInfo() {
  return os.cpus();
}
// @mainProcess
export async function monitorCPU() {
  const initial = os.cpus();
  return 'initial2:'+initial;
}
// 这是会被编译进入主进程的
export async function getDocumentsPath2() {
  try {
      let path = await Main.app.getPath('documents');
      console.log('Selected getDocumentsPath2:', path);
      return path; // 返回路径给调用方
  } catch (error) {
      console.error('getDocumentsPath失败:', error);
  }
}