
/* ------------------------------------------------------------------------- *\
*                 Веб-приложение по поиску фильмов и сериалов
\* ------------------------------------------------------------------------- */

/* ---------------- Ввод данных от пользователя через форму ---------------- */

// Навигация и получение доступа к форме и элементам формы
const titleInput = document.getElementById('title-input');
const typeSelect = document.getElementById('type-select');
const searchButton = document.getElementById('search-button');
const statusOutput = document.getElementById('status-output');
const searchResultsContainer = document
    .getElementById('search-results-container');

// Входные данные для поиска
let title;
let type;


/* ------------- Асинхронный запрос и обработка событий формы -------------- */

// Асинхронная функция для отправки запроса и получения ответа
async function getCinemaInfo(url) {
    const response = await fetch(url, {
        headers: {
            // API ключ вы можете получить бесплатно по данном адресу https://kinopoiskapiunofficial.tech/
            'X-API-KEY': 'babd72f9-9560-4373-a5c3-9e8caae771fc'
        }
    });
    return await response.json();
}

// Массив всех результатов поиска
let generalSearchResults = [];


// Переменная текущей страницы результатов
let pageNumber = 1;

// Функция для обработка начального запроса
async function processInitialSearchRequest() {

    // Отмена запроса в случае отсутствия title
    if (!titleInput.value) {
        statusOutput.innerText = 'Empty title\nPlease enter title';
        return;
    }

    // Отмена запроса в случае повторения входных данных title и type
    if (titleInput.value == title && typeSelect.value == type) {
        statusOutput.innerText = 'Repeated title and type\nPlease enter new ones';
        return;
    }

    // Отмена запроса в случае несоответствия title к шаблону
    const regexp = /^[a-zа-я0-9][a-zа-я0-9 ,.!?&\-:']+$/i;

    if (!regexp.test(titleInput.value)) {
        statusOutput.innerText =
            'Mistake in title\nTitle starts with letters, digits, please enter valid one';
        return;
    }

    // Входные данные для поиска
    title = titleInput.value;
    titleInput.value = '';
    type = typeSelect.value;

    // Вывод поискового запроса
    statusOutput.innerText = `Search for ${type}\n"${title}"`;

    // Очистка результатов предыдущего поиска
    const cinemaCards = searchResultsContainer.querySelectorAll('.cinema-card');
    for (const cinemaCard of cinemaCards) {
        cinemaCard.remove();
    }

    // Массив всех результатов поиска
    generalSearchResults = [];

    // Переменная текущей страницы результатов
    pageNumber = 1;

    // Формирование URL-адреса
    const url = `https://kinopoiskapiunofficial.tech/api/v2.2/films?order=RATING&type=${type.toUpperCase()}&keyword=${title}&page=${pageNumber}`;

    // Отправка запроса и получение ответа
    const response = await getCinemaInfo(url);
    console.log('response :>> ', response);
    
    // Получение верного ответа с сервера
    const searchResults = response.items;
    generalSearchResults = generalSearchResults.concat(searchResults);
    // Обработка результатов поиска
    processSearchResults(searchResults);    
}

// Обработка события submit
searchButton.addEventListener('click', processInitialSearchRequest);

// Обработка события по нажатию на клавишу Enter
titleInput.addEventListener('keydown', function(event) {
    if (event.code == 'Enter') {
        processInitialSearchRequest();
    }
});


// Обработка события прокрутки
document.addEventListener('scroll', async function() {
    const availScrollHeight = document.documentElement.scrollHeight
        - document.documentElement.clientHeight;
    const currentScroll = Math.ceil(window.pageYOffset);

    if (currentScroll >= availScrollHeight) {
        
        // Переменная текущей страницы результатов
        pageNumber += 1;

        // Формирование URL-адреса
        const url = `https://kinopoiskapiunofficial.tech/api/v2.2/films?order=RATING&type=${type.toUpperCase()}&keyword=${title}&page=${pageNumber}`;

        // Отправка запроса и получение ответа
        const response = await getCinemaInfo(url);
        
        // Получение верного ответа с сервера
        const searchResults = response.items;
        generalSearchResults = generalSearchResults.concat(searchResults);
        // Обработка результатов поиска
        processSearchResults(searchResults);
    }
});


// Обработка результатов поиска
function processSearchResults(searchResults) {
    for (const cinemaInfo of searchResults) {

        // Деструктуризация объекта
        const { posterUrlPreview: poster, nameOriginal: title,
            ratingKinopoisk: rating, year, kinopoiskId } = cinemaInfo;

        // Создание новых HTML-элементов
        const cinemaCard = 
            `<div class="cinema-card" data-kinopoisk-id="${kinopoiskId}">
                <div class="poster">
                    <img src="${poster}" alt="Poster of ${title}">
                </div>
                <div class="info">
                    <div class="rating-favorite-container">
                        <p class="rating">${rating}</p>
                        <div class="favorite-icon"></div>
                    </div>
                    <h6 class="title">${title}</h6>
                    <p class="year">${year}</p>
                </div>
            </div>`;

        // Вставка нового HTML-элемента
        searchResultsContainer.insertAdjacentHTML('beforeend', cinemaCard);        
    }
}


// Обработка события клика по карточкам
searchResultsContainer.addEventListener('click', async function(event) {

    // Список избранного
    if (event.target.classList.contains('favorite-icon')) {
        const favoriteIcon = event.target;
        const kinopoiskId = favoriteIcon.closest('.cinema-card')
            .dataset.kinopoiskId;

        // Удаление из избранного
        if (favoriteIcon.classList.contains('active')) {
            favoriteIcon.classList.remove('active');

            localStorage.removeItem(kinopoiskId);
        }
        // Добавление в избранное
        else {
            favoriteIcon.classList.add('active');            

            const cinemaInfo = generalSearchResults.find(
                cinemaInfo => cinemaInfo.kinopoiskId == kinopoiskId
            );

            localStorage.setItem(kinopoiskId, JSON.stringify(cinemaInfo));
        }

        console.log(localStorage);

        return;
    }

    // Карточка фильма
    const cinemaCard = event.target.closest('.cinema-card')

    if (cinemaCard) {
        // ID фильма в базе OMDb
        const kinopoiskId = cinemaCard.dataset.kinopoiskId;
        // Формирование URL-адреса
        const url = `https://kinopoiskapiunofficial.tech/api/v2.2/films/${kinopoiskId}`;

        // Отправка запроса и получение ответа
        const cinemaFullInfo = await getCinemaInfo(url);
        console.log('cinemaFullInfo :>> ', cinemaFullInfo);

        // Деструктуризация объекта
        const {
            posterUrl: poster,
            ratingKinopoisk: rating,
            nameOriginal: title,
            genres,
            countries,
            year,
            shortDescription: description,
            webUrl
        } = cinemaFullInfo;

        // Создание новых HTML-элементов
        const cinemaFullCard =
            `<div id="fixed-container">
                <div id="cinema-full-card">
                    <div class="poster">
                        <img src="${poster}" alt="Poster of ${title}">
                    </div>
                    <div class="info">
                        <p class="rating">${rating}</p>
                        <h2 class="title">${title}</h2>
                        <h3 class="genre">
                            ${genres.map(item => item.genre)
                                .join(', ')
                                .replace(/^./, letter => letter.toUpperCase())}
                        </h3>
                        <h3 class="countries">
                            ${countries.map(item => item.country).join(', ')}
                        </h3>
                        <p class="year">${year}</p>
                        <p class="description">${description}</p>
                        <a href="${webUrl}" target="_blank">Link to Kinopoisk</a>
                    </div>
                    <button>&times;</button>
                </div>
            </div>`;
            
        // Вставка нового HTML-элемента
        document.body.insertAdjacentHTML('beforeend', cinemaFullCard);

        // Закрытие окна
        document.querySelector('#cinema-full-card button')
            .addEventListener(
                'click',
                function() {
                    document.querySelector('#cinema-full-card').remove();
                },
                { once: true }
            );
    }
});



/* ----------------- Материалы, рекомендованные к прочтению ---------------- */

// Браузерное окружение, спецификации
// https://learn.javascript.ru/browser-environment

// DOM-дерево
// https://learn.javascript.ru/dom-nodes

// Навигация по DOM-элементам
// https://learn.javascript.ru/dom-navigation

// Поиск: getElement*, querySelector*
// https://learn.javascript.ru/searching-elements-dom

// Свойства узлов: тип, тег и содержимое
// https://learn.javascript.ru/basic-dom-node-properties


// Свойства и методы формы
// https://learn.javascript.ru/form-elements

// Отправка формы: событие и метод submit
// https://learn.javascript.ru/forms-submit


// Введение в браузерные события
// https://learn.javascript.ru/introduction-browser-events

// Справочник по событиям
// https://developer.mozilla.org/ru/docs/Web/Events

// Действия браузера по умолчанию
// https://learn.javascript.ru/default-browser-action


// Асинхронные запросы AJAX
// XMLHttpRequest
// https://learn.javascript.ru/xmlhttprequest

// Формат JSON, метод toJSON
// https://learn.javascript.ru/json


// Сервис по предоставлению информации о фильмах или сериалах\
// http://www.omdbapi.com/
