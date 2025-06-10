/**
 * @description 主进程函数，用于 GitHub API 调用
 */

// @mainProcess
export async function fetchGitHub_viaProxy() {
  const response = await fetch('https://api.github.com');
  const data = await response.json();
  return data;
}

// @mainProcess
export function fetchGitHub_viaCallback() {
  fetch('https://api.github.com')
    .then(response => response.json())
    .then(data => callback(data))
    .catch(err => callback({ error: 'errorjiejie222-王八蛋:' + err.message }));
}
// @mainProcess
export function getMainConfig2(callback) {
    const { dialog } = require('electron')
    dialog.showOpenDialog({ properties: ['openFile', 'multiSelections'] })
}