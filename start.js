const { Client,MessageMedia , LocalAuth,LegacySessionAuth} = require('whatsapp-web.js');
const QRCode = require('qrcode');
const fs = require('fs');
const WebSocket = require('ws');
const http = require('http');
const open = require("opn");
const path = require('path');
const XLSX = require('xlsx');
require('dotenv').config();

var contacts = []
var start = false


// Criar um servidor HTTP
const server = http.createServer((req, res) => {
  // Servir a página HTML
  if (req.url === '/') {
    fs.readFile('./views/index.html', 'utf8', (err, data) => {
      if (err) {
        res.writeHead(500);
        return res.end('Erro ao carregar a página');
      }
      res.writeHead(200, { 'Content-Type': 'text/html' });
      res.end(data);
    });
  }
  else if (req.url.startsWith('/public/')) {
    // Serve arquivos estáticos
    const filePath = path.join(__dirname, req.url);
    const extname = path.extname(filePath);
    let contentType = 'text/html';

    switch (extname) {
      case '.js':
        contentType = 'text/javascript';
        break;
      case '.css':
        contentType = 'text/css';
        break;
      case '.png':
        contentType = 'image/png';
        break;
      case '.jpg':
        contentType = 'image/jpeg';
        break;
      case '.gif':
        contentType = 'image/gif';
        break;
      default:
        contentType = 'application/octet-stream';
    }

    fs.readFile(filePath, (err, content) => {
      if (err) {
        res.writeHead(404);
        res.end('Arquivo não encontrado');
      } else {
        res.writeHead(200, { 'Content-Type': contentType });
        res.end(content);
      }
    });
  } else {
    res.writeHead(404);
    res.end('Página não encontrada');
  }
});

// Criar um servidor WebSocket
const wss = new WebSocket.Server({ server });

// Evento de conexão: é disparado quando um cliente se conecta
wss.on('connection', (ws) => {
  console.log('Novo cliente conectado');

  // Evento de mensagem: é disparado quando o servidor recebe uma mensagem do cliente
  ws.on('message', async (message) => {
    var json_m = JSON.parse(message)
    if(json_m.status == 1){
      const pasta = path.join(__dirname, 'dados.json');
      // Ler o conteúdo do arquivo JSON
      let json_numero;

      fs.readFile(pasta, 'utf8', async function(err, date){
        try{
          var jsondate = JSON.parse(date)
          json_numero = jsondate.chave
          if(json_m.start== 1){
            ws.send(JSON.stringify({ms:"Gerando o QR code Aguarde..."}) );
            const imagePath = path.join(__dirname, 'imagem', 'image1.png');
            await suianne(json_m.menssagem, json_m.d, imagePath, 0,1, null)
          }
          if(json_m.start ==2){
            ws.send(JSON.stringify({ms:"Vamos enviar de onde parou.\nSe Conecte no Whatsapp Web..."}) );
            const imagePath = path.join(__dirname, 'imagem', 'image1.png');
            await suianne(json_m.menssagem, json_m.d, imagePath, json_numero, 1, null)
          }
          if(json_m.start == 3){
            ws.send(JSON.stringify({ms:"Gerando o QR code Aguarde..."}) );
            const imagePath = path.join(__dirname, 'imagem', 'image1.png');
            await suianne(json_m.menssagem, json_m.d, "", 0, 0,null)
          }
          if(json_m.start == 5){
            ws.send(JSON.stringify({ms:"Gerando o QR code Aguarde..."}) );
            const imagePath = path.join(__dirname, 'imagem', 'image1.png');
            await suianne(json_m.menssagem, json_m.d, "", 0, 0, json_m.session)
          }

            async function suianne(mensagem, d, imagem, index_, pass, session){
              const SESSION_FILE_PATH = './sessions';
              // Load the session data if it has been previously saved
              let sessionData;
              if(fs.existsSync(SESSION_FILE_PATH+"/"+json_m.session+".json")) {
                  sessionData = require(SESSION_FILE_PATH+"/"+json_m.session+".json");
              }
              const auth = session?{authStrategy: new LocalAuth({session: sessionData})}:{authStrategy: new LocalAuth()}
              const client = await new Client(auth);
                if(session==null){ 
                client.on('qr', (qr) => {
                    // Generate and scan this code with your phone
                    // Dados a serem codificados no QR Code
                    const data = qr;
                    // Opções de configuração
                    const options = {
                    errorCorrectionLevel: 'L', // Nível de correção de erro
                    type: 'image/png', // Tipo de imagem
                    quality: 1, // Qualidade da imagem
                    margin: 1 // Margem ao redor do código QR
                    };
                    // Gera o QR Code
                    QRCode.toFile('./qrcode.png', data, options, (err) => {
                    if (err) {
                        console.error('Erro ao gerar o QR Code:', err);
                    } else {
                        console.log('QR Code gerado com sucesso!');
                        ws.send(JSON.stringify({"imagem": qr}));
                    }
                    });
                  });
                }
                console.log("iniciando")
                client.on('ready', async() => {
                    const listas_numeros = await fs.readFileSync('lista.json')
                    var c  = JSON.parse(listas_numeros)
  
                    if(pass ==1){
                      console.log('Conectado');
                      const n= await client.getContacts()
                      console.log(n.length)
                      for(i =0;i<n.length;i++){
                        if(n[i].name !== undefined){
                          contacts.push([n[i].id._serialized, n[i].name])
                        }
                        else{
                          contacts.push([n[i].id._serialized, "Cliente"])
                        }
                      }
                    }
                    const number = pass ==1?contacts:c.numeros
                    const message = mensagem
                    const index = number.length
                    const delay_ = d*1000
                    var tempo_total = d*index -json_numero                
                    function tempo(milissegundos){
                        var horas = Math.floor(milissegundos / 3600);
                        segundos %= 3600;
                        var minutos = Math.floor((milissegundos% 3600) / 60);
                        var segundos = milissegundos % 60;
                        return horas+ " horas, "+minutos +" minutos, "+segundos+" segundos"
                    }
                    ws.send(JSON.stringify({"contato": contacts.length+ " Contatos",ms:"Tempo estimado "+tempo(d*index)}) );
                    for(let i = index_ ==0?0:index_; i<index; i++){                    
                        const fileData = fs.readFileSync("image1.png", {
                          encoding: 'base64',
                                    })
                        var media = new MessageMedia(
                          "image/png",fileData,"image"
                        )
                        try{
                          if(json_m.start == 3){
                            if(number[i][0].length==12){
                              client.sendMessage(number[i][0]+"@c.us", media, {caption: message.replace("#nome", number[i][1])})
                            }
                          }
                          else{
                            client.sendMessage(number[i][0], media, {caption: message.replace("#nome", number[i][1])})
                          }  
                        }
                        catch(err){
                          console.log("Deu o sguinte erro:"+err)
                        }
                        const carrosJson = fs.readFileSync('dados.json');
                        const carros = JSON.parse(carrosJson);
                        carros.chave = i; // Por exemplo, alterando a marca para 'Toyota'
    
                        // Converte de volta para JSON
                        const novoJson = JSON.stringify(carros, null, 2);
    
                        // Salva o JSON modificado de volta no arquivo
                        fs.writeFileSync('dados.json', novoJson);
    
                        tempo_total = tempo_total - d
                        ws.send(JSON.stringify({"contato": (contacts.length -(i+1))+ " Contatos " ,ms:"Tempo restante " +tempo(tempo_total)}) );
                        console.log(i)
                        await new Promise(resolve => setTimeout(resolve, delay_));
                    }
                    ws.send(JSON.stringify({ms:"Disparo concluido!"}) );
                    const carrosJson = fs.readFileSync('dados.json');
                    const carros = JSON.parse(carrosJson);
                    carros.chave = 0; // Por exemplo, alterando a marca para 'Toyota'
                    console.log('\x1b[32m%s\x1b[0m', "Menssagens enviadas com sucesso ✔️")
                });
                /*client.on('authenticated', async (s) => {
                  fs.writeFile("./session.json", JSON.stringify(s), (err) => {
                      if (err) {
                          console.error(err);
                      }
                  });
                });*/
                client.initialize();
            }    
        }
        catch{}
      });
    }
    if(json_m.status == 2){
      const data = JSON.parse(message.toString('utf-8'));

      const contentType = data.contentType;
      const base64String = data.data;

      const imgData = Buffer.from(base64String, 'base64');
      const imagePath = path.join(__dirname, 'imagem', 'image1.png');

      // Verificar se o arquivo existe e excluí-lo
      if (fs.existsSync(imagePath)) {
          fs.unlink(imagePath, (err) => {
              if (err) {
                  console.error('Erro ao excluir o arquivo existente:', err);
              }

              console.log('Arquivo existente excluído com sucesso!');
          });
      }
      fs.writeFile('./image1.png', imgData, (err) => {
          if (err) {
              console.error('Erro ao salvar a imagem:', err);
          }
          console.log('Imagem salva com sucesso!');
      });

      ws.send(JSON.stringify({ms:"Imagem adicionada!"}) );
    }
    if(json_m.status == 3){
      process.exit()
    }
    if(json_m.status == 4){

      const fileBuffer = Buffer.from(json_m.data, 'base64');      
      try {
        const workbook = XLSX.read(fileBuffer);
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const data = XLSX.utils.sheet_to_json(worksheet);
        var x = []
        data.forEach(element=> {
          var ele = Object.keys(element)[0]
          var ele2 = Object.keys(element)[1]
          if(element[ele].toString().startsWith('0800')==false){
            if((element[ele].toString().replace(/\D+/g, '')).startsWith("55") == false){
              if((element[ele].toString().replace(/\D+/g, '')).length >7){
                if((element[ele].toString().replace(/\D+/g, '')).length == 10){
                  var feito = element[ele].toString().replace(/\D+/g, '') 
                  x.push(["55"+feito,element[ele2]])
                }
                else{
                  var numero_teste = element[ele].toString().replace(/\D+/g, '')
                  if(numero_teste.length ==10){
                    let posicao = numero_teste.length - 8 ; // Posição após o 8º dígito da direita
                    let resultado = numero_teste.slice(0, posicao) + '9' + numero_teste.slice(posicao);
                    x.push(["55"+resultado, element[ele2]])
                  }
                  else{
                  }
                }
              }
            }
            else{
              if((element[ele].toString().replace(/\D+/g, '')).length >7){
                if((element[ele].toString().replace(/\D+/g, '')).length ==12||(element[ele].toString().replace(/\D+/g, '')).length ==13){
                  x.push([element[ele].toString().replace(/\D+/g, ''), element[ele2]])
                }
              }
            }
          }
        })
        const listas = fs.readFileSync('lista.json');
        const c = JSON.parse(listas);
        console.log(x)
        c.numeros = x;
        const novoJsons = JSON.stringify(c, null, 2);
        fs.writeFileSync('lista.json', novoJsons);

    } catch (err) {
        console.error('Erro ao processar o arquivo Excel', err);
    }
    }
    if(json_m.status ==5){
      const arquivos = fs.readdirSync("sessions");

      // Filtra e exibe apenas as pastas
      const pastas = arquivos.filter(arquivo => fs.statSync(path.join("sessions", arquivo)).isDirectory());
    
      // Exibe as pastas encontradas
      ws.send(JSON.stringify({sessions:pastas}) );
    }
  });

  // Evento de fechamento: é disparado quando a conexão com o cliente é fechada
  ws.on('close',  (code, reason) => {
    console.log(`Cliente desconectado. Código: ${code}, Razão: ${reason}`);
  });
});

// Iniciar o servidor na porta 8080
server.listen(8080, () => {
  console.log('Servidor rodando na porta 8080');
  open('http://localhost:8080');

});




