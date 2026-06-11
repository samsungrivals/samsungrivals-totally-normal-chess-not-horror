// Update Loading Screen
document.addEventListener('DOMContentLoaded', () => {
    let loader = document.createElement('div');
    loader.id = 'update-loader';
    loader.style.cssText = 'position:fixed;top:0;left:0;width:100vw;height:100vh;background:#111;z-index:9999999;display:flex;flex-direction:column;justify-content:center;align-items:center;color:#fff;font-family:sans-serif;transition:opacity 0.5s;';
    loader.innerHTML = '<div style="font-size:32px;margin-bottom:20px;font-weight:bold;color:#00c6ff;">Checking for Updates...</div><div style="font-size:18px;color:#0f0;">Loading Game V47...</div><div style="margin-top:20px;width:200px;height:10px;background:#333;border-radius:5px;overflow:hidden;"><div style="width:0%;height:100%;background:#0f0;transition:width 2.5s ease-out;" id="loader-bar"></div></div>';
    document.body.appendChild(loader);
    
    setTimeout(() => {
        let bar = document.getElementById('loader-bar');
        if(bar) bar.style.width = '100%';
    }, 100);
    
    setTimeout(() => {
        loader.style.opacity = '0';
        setTimeout(() => loader.remove(), 500);
    }, 2600);
});
