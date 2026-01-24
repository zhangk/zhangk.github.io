// middleware.js - 纯前端验证，无任何依赖
module.exports = (req, res) => {
  // --- 调试行：无论是否拦截，都添加一个响应头 ---
  res.setHeader('X-Debug-Middleware', 'executed');
  
  // 如果不是访问根路径或HTML页面，直接放行（保证CSS/JS能加载）
  if (!req.url.match(/^\/($|\?|posts\/|page\/|categories\/|tags\/)/)) {
    return;
  }

  // 设置响应头，返回一个包含验证逻辑的HTML页面
  res.statusCode = 200;
  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.end(`
<!DOCTYPE html>
<html>
<head>
    <title>验证访问</title>
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <style>
        body { font-family: system-ui, sans-serif; padding: 2rem; text-align: center; background: #f5f5f5; }
        .box { background: white; padding: 2rem; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); display: inline-block; margin-top: 5rem; }
        input { padding: 12px; width: 200px; border: 1px solid #ddd; border-radius: 4px; font-size: 16px; }
        button { padding: 12px 24px; background: #0070f3; color: white; border: none; border-radius: 4px; font-size: 16px; cursor: pointer; margin-left: 8px; }
        button:hover { background: #0051bb; }
        .error { color: #e00; margin-top: 1rem; display: none; }
        .hint { color: #666; font-size: 0.9rem; margin-top: 1.5rem; }
    </style>
</head>
<body>
    <div class="box">
        <h2>🔒 私人博客</h2>
        <p>请输入访问密码：</p>
        <form id="authForm" onsubmit="return validatePassword()">
            <input type="password" id="passwordInput" placeholder="密码" autofocus />
            <button type="submit">进入</button>
        </form>
        <p id="errorMsg" class="error">密码错误，请重试。</p>
        <p class="hint">提示：密码已通过SHA-256哈希验证，不会在网络中传输明文。</p>
    </div>

    <script>
        // 这里填入你生成的密码哈希值
        const correctHash = 'ef92b778bafe771e89245b89ecbc08a44a4e166c06659911881f383d4473e94f';

        async function validatePassword() {
            const input = document.getElementById('passwordInput').value;
            const errorEl = document.getElementById('errorMsg');

            // 计算输入密码的SHA-256哈希
            const encoder = new TextEncoder();
            const data = encoder.encode(input);
            const hashBuffer = await crypto.subtle.digest('SHA-256', data);
            const hashArray = Array.from(new Uint8Array(hashBuffer));
            const inputHash = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');

            // 与正确哈希比对
            if (inputHash === correctHash) {
                // 验证成功，将哈希存入SessionStorage并重定向到原页面
                sessionStorage.setItem('auth_hash', inputHash);
                window.location.href = '/'; // 跳转到博客首页
            } else {
                // 验证失败，显示错误
                errorEl.style.display = 'block';
                document.getElementById('passwordInput').value = '';
                document.getElementById('passwordInput').focus();
            }
            return false; // 阻止表单默认提交
        }

        // 页面加载时检查是否已认证（防止循环重定向）
        if (sessionStorage.getItem('auth_hash') === correctHash) {
            window.location.href = '/';
        }
    </script>
</body>
</html>
  `);
};
