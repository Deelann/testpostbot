const fs = require("fs");
const path = require("path");
const _ = require("lodash");
const { Telegraf, Input } = require("telegraf");
const { message } = require("telegraf/filters");
const cron = require("node-cron");
const config = require("config");

// токен бота
const token = config.get("telegram.token");
// идентификатор чата или канала
const chatId = config.get("telegram.chatId");
// путь к папке с файлами
const filePath = config.get("filePath");
// расписание
const jobSchedule = config.get("cron");
// режим запуска
const mode = config.get("mode");

// экземпляр бота
const bot = new Telegraf(token);

/**
 * Запуск отправки постов в чат или канал
 */
const run = () => {
  // чтение папки
  fs.readdir(filePath, (error, files) => {
    console.log("Запущен обработчик файлов...");

    if (!files && files.length <= 0)
      console.log("По указанному пути нет постов");

    // проверка, есть ли ошибка чтения
    if (error) return console.log(error);

    // сгруппированный по постам массив файлов
    const groupFiles = _.groupBy(files, (name) => name.split("-")[0]);

    // вывод в консоль количество постов в папке
    console.log(`Найдено постов: ${Object.keys(groupFiles).length}`);

    // перебора постов
    Object.keys(groupFiles).forEach((key) => {
      // список файлов поста
      const msgFiles = groupFiles[key];
      // текстовое сообщение
      const msg = msgFiles[0];
      // изображения
      const images = msgFiles.filter((f) => f.includes("jpg"));
      // видео
      const videos = msgFiles.filter((f) => f.includes("mp4"));

      pushImages(images, msg);
      pushVideos(videos);
    });

    console.log("Обработка файлов завершена....");
  });
};

/**
 * Отправка сообщения
 * @param {string} file
 */
const pushPost = (file) => {
  fs.readFile(file, function (error, data) {
    if (error) return console.log(error);

    // выводим считанные данные
    if (data) bot.telegram.sendMessage(CHANNEL_ID, data.toString());
  });
};

/**
 * Отправка изображений в канал
 * @param {Array<string>} images
 * @param {string} msg
 */
const pushImages = (images, msg) => {
  if (!images || images.length === 0) return;

  fs.readFile(getFilePath(msg), (error, data) => {
    if (error) return console.log(error);

    let index = 0;

    images
      .sort((a, b) => a.localeCompare(b))
      .forEach((image) => {
        const url = getFilePath(image);
        bot.telegram.sendPhoto(chatId, Input.fromLocalFile(url), {
          caption: index === 0 ? data.toString() : ""
        });
        index++;
      });
  });
};

/**
 * Отправка видео в канал
 * @param {Array<string>} videos
 */
const pushVideos = (videos) => {
  if (!videos || videos.length === 0) return;
  videos.forEach((video) => {
    const url = getFilePath(video);
    const videoPath = Input.fromReadableStream(fs.createReadStream(url));
    bot.telegram.sendPhoto(CHANNEL_ID, videoPath);
  });
};

/**
 * Получить полный путь к файлу
 * @param {string} file
 * @returns string
 */
const getFilePath = (file) => {
  return file ? `./${filePath}/${file}` : null;
};

// режим запуска
// 'mode' = 0, обычный запуска,
// любое другое значние, через крон
if (mode === 0) {
  run();
} else {
  cron.schedule(jobSchedule, run);
}

// Enable graceful stop
process.once("SIGINT", () => bot.stop("SIGINT"));
process.once("SIGTERM", () => bot.stop("SIGTERM"));
