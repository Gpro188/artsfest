const fs = require('fs');

async function upload() {
  const fileContent = "hello world";
  const blob = new Blob([fileContent], { type: 'text/plain' });
  const formData = new FormData();
  formData.append("file", blob, "test.txt");
  formData.append("folder", "test");

  const res = await fetch('http://localhost:3000/api/upload', {
    method: 'POST',
    body: formData
  });
  console.log(res.status, await res.text());
}
upload();
