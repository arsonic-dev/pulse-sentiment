fetch('http://localhost:8080/health')
    .then(r => r.text())
    .then(console.log)
    .catch(console.error);
