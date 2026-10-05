from pathlib import Path
import json

p=Path('index.html')
s=p.read_text(encoding='utf-8')
anchor='''  if(typeof textarea.setSelectionRange==="function") textarea.setSelectionRange(0,textarea.value.length);
  else if(typeof textarea.select==="function") textarea.select();
}'''
repl='''  if(typeof textarea.setSelectionRange==="function") textarea.setSelectionRange(0,textarea.value.length);
  else if(typeof textarea.select==="function") textarea.select();
  if(textarea===outputEl) lastOutputSelection={start:0,end:textarea.value.length};
}'''
assert anchor in s, 'selectAll anchor missing'
s=s.replace(anchor,repl,1)
assert 'async function cutSelectedOutput(){\n  const indexes=' in s
s=s.replace('async function cutSelectedOutput(){\n  const indexes=','async function cutSelectedOutput(){\n  rememberOutputSelection();\n  const indexes=',1)
old='''  await writeClipboardText(selectedText);

  const inputBefore=inputEl.value;'''
new='''  const copied=await writeClipboardText(selectedText);
  if(!copied){
    setStatus("Không thể ghi phần đã cắt vào bộ nhớ tạm. Tin chưa bị xóa.","err");
    return;
  }

  const inputBefore=inputEl.value;'''
assert old in s, 'clipboard anchor missing'
s=s.replace(old,new,1)
s=s.replace('Đã cắt ${indexes.length} dòng • đã xóa tin gốc tương ứng','Đã cắt ${indexes.length} dòng • đã copy • đã xóa tin gốc tương ứng',1)
s=s.replace('Đã cắt ${indexes.length} dòng • tin gốc vẫn giữ vì chưa cắt đủ','Đã cắt ${indexes.length} dòng • đã copy • tin gốc giữ đến khi cắt hết kết quả của tin đó',1)
s=s.replace('1.0.15','1.0.16')
p.write_text(s,encoding='utf-8')

vp=Path('version.json')
v=json.loads(vp.read_text(encoding='utf-8'))
v['version']='1.0.16'; v['updated']='2026-10-05'; v['notes']='Tách Ngang Cut writes clipboard before removing result/source and preserves Select All across button focus; business engine unchanged.'
vp.write_text(json.dumps(v,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')

sp=Path('sw.js')
sw=sp.read_text(encoding='utf-8')
assert 'tach-dai-ngang-v1.0.15' in sw
sw=sw.replace('tach-dai-ngang-v1.0.15','tach-dai-ngang-v1.0.16').replace('version:"1.0.15"','version:"1.0.16"')
sp.write_text(sw,encoding='utf-8')
