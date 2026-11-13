"""Prueba de humo de fama: abre index.html con la IA simulada (mock) y recorre todo el juego.
Uso: pip install playwright && playwright install chromium && python tests/test_ui.py
"""
import asyncio, json
from playwright.async_api import async_playwright
import os, pathlib
HERE=pathlib.Path(__file__).resolve().parent
PAGE=(HERE.parent/'index.html').as_uri()
os.makedirs(HERE/'screenshots',exist_ok=True)
MOCK = """
window.claude={use:async(n)=>{ if(n!=='sample') return null;
 const f=async(p)=>({text:''}); f.json=async(p)=>{
  if(p.includes('Crea 6 personajes')) return {personajes:[1,2,3,4,5,6].map(i=>({nombre:'Pj'+i,usuario:'pj'+i,bio:'bio '+i,personalidad:'loco',fama:1000*i,relacion:'amigos'}))};
  if(p.includes('primer post')) return {post:'Hola!',comentarios:[],likes:5,postsSobreTi:[{nombre:'Chisme',usuario:'chisme',esNoticia:true,texto:'Nuevo en la red'}]};
  if(p.includes('NUEVO POST')) { const id=(p.match(/id:(c\\w+)/)||[])[1]; return {comentarios:[{id,texto:'jaja'},{nombre:'Npc',usuario:'npc',texto:'wow'}],likes:300,reposts:20,nuevosSeguidores:150,viral:true,humor:10,aura:5,drama:110,cambiosAfinidad:[{id,delta:50}],recuerdos:[{id,recuerdo:'le gusta la playa'}],postsSobreTi:[{nombre:'News',usuario:'news',esNoticia:true,texto:'Escándalo!'}],dm:{id,texto:'oye!'},nuevoPersonaje:{nombre:'Nuevo',usuario:'nuevo',bio:'x',personalidad:'y',fama:10}};}
  if(p.includes('ESCRÍBELE') || p.includes('TÚ PRIMERO')) return {texto:'hola de la nada'};
  if(p.includes('Responde como')) return {respuesta:'qué tal',delta:2,recuerdo:'es de PR'};
  if(p.includes('Narra')) return {historia:'Fueron a la playa.',postDelPersonaje:'Playa con mi pana',likes:50,nuevosSeguidores:10,afinidad:10,humor:1,aura:1,drama:0,recuerdo:'playa',postsSobreTi:[]};
  return {};
 }; return f; }};
"""
async def main():
  async with async_playwright() as p:
    b=await p.chromium.launch(executable_path=os.environ.get('CHROME') or None)
    pg=await b.new_page(viewport={'width':400,'height':800})
    errs=[]; pg.on('pageerror',lambda e:errs.append(str(e)))
    await pg.add_init_script(MOCK)
    await pg.goto(PAGE); await pg.wait_for_timeout(800)
    await pg.click('.pick'); await pg.click('#nx')
    await pg.fill('#nm','Juan'); await pg.click('#fd .chip'); await pg.click('#go'); await pg.wait_for_timeout(300)
    await pg.click('.pick'); await pg.click('#go'); await pg.wait_for_timeout(600)
    await pg.fill('#tx','mi post'); await pg.select_option('#con',index=1); await pg.click('#pub'); await pg.wait_for_timeout(600)
    await pg.screenshot(path=str(HERE/'screenshots')+'/feed.png',full_page=False)
    await pg.click('nav [data-v=mensajes]'); await pg.click('#pk'); await pg.wait_for_timeout(300)
    await pg.click('.card[data-c]'); await pg.fill('#mi','hola'); await pg.click('#snd'); await pg.wait_for_timeout(300)
    await pg.screenshot(path=str(HERE/'screenshots')+'/dm.png')
    await pg.click('nav [data-v=seguidores]'); await pg.click('[data-pl]'); await pg.click('[data-a]'); await pg.click('#ya'); await pg.wait_for_timeout(400)
    await pg.screenshot(path=str(HERE/'screenshots')+'/planes.png')
    await pg.click('nav [data-v=perfil]'); await pg.wait_for_timeout(200)
    await pg.screenshot(path=str(HERE/'screenshots')+'/perfil.png',full_page=True)
    print('errors',errs)
    print(await pg.evaluate("JSON.parse(localStorage.getItem('estado_juego_v2')).stats"))
    print(await pg.evaluate("JSON.parse(localStorage.getItem('estado_juego_v2')).logros"))
    await b.close()
asyncio.run(main())
