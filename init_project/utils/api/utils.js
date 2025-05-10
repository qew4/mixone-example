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
