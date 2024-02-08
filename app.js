const fs = require("fs");
const path = require("path");
const _ = require("lodash");
const { Telegraf } = require("telegraf");
const { message } = require("telegraf/filters");

// чтение папки
fs.readdir("files", (error, files) => {
  console.log("Запущен обработчик файлов...");
  // проверка, есть ли ошибка чтения
  if (error) return console.log(error);

  const op = files.map((name) => ({
    name: name.split("-")[0],
    filePath: "files/" + name,
  }));

  const groupFiles = _.groupBy(files, (name) => name.split("-")[0]);

  Object.keys(groupFiles).forEach((key) => {
    const msg = groupFiles[key];
    pushPost(`files/${msg[0]}`);
  });

  console.log("Обработка файлов завершена...");
});

const token = "6516029694:AAFcm3HRJn9qWza93THo3jfnNoiF4aNAtZQ";
const bot = new Telegraf(token);
const CHANNEL_ID = -1001693693655;

//bot.launch();

const pushPost = (filePath) => {
  fs.readFile(filePath, function (error, data) {
    if (error) {
      // если возникла ошибка
      return console.log(error);
    }
    //console.log(data);
    // выводим считанные данные
    if (data) bot.telegram.sendMessage(CHANNEL_ID, data.toString());
  });
};

// Enable graceful stop
process.once("SIGINT", () => bot.stop("SIGINT"));
process.once("SIGTERM", () => bot.stop("SIGTERM"));
