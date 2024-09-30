
/**
 * the base-url for xhr calls
 */
const baseUrlForPokemon = 'https://pokeapi.co/api/v2/pokemon/';

/**
 * vars used for displaying the pokemon list
 */
let listOffset = 0; // starting point for retrieving data
let listLength = 10; // the number of pokemons to be displayed in the list
let listSortBy = 'timestamp'; // values for s
let listSortOrder = 'desc';

/**
 * complete pokemon vars
 */
let pokemonsCompleteCount = 0; // the total number of pokemons available
let pokemonsCompleteObject = {}; // the complete object of pokemons retrieved by xhr

/**
 * storage for the currently selected pokemon object
 */
let currentItem = {};

/**
 * status of the page (used for preventing multiple page initialization on window.load)
 */
let isInitializedPage = false;

/**
 * retrieves pokemon list
 * @param {String} type 
 * @param {String} containerID 
 * @param {String} url 
 * @param {Boolean} isSearchResult 
 * @param {Number} initStep 
 */
const getPokemonsByUrl = (type, containerID, url, isSearchResult = false, initStep = 0) => {
    if (initStep > 0) {
        switch (initStep) {
            case 1:
                url = baseUrlForPokemon + '?offset=0&limit=1';
            case 2:
                url = baseUrlForPokemon + '?offset=0&limit=' + pokemonsCompleteCount;
                type = 'list';
                containerID = 'outputContainer';
        }
    }

    const data = '';
    const xhr = new XMLHttpRequest();
    xhr.withCredentials = false;

    // pass needed  data to xhr
    xhr.data = {
        type: type,
        containerID: containerID,
        isSearchResult: isSearchResult,
        initStep: initStep,
    };

    xhr.addEventListener("readystatechange", function (x) {
        if (this.readyState === this.DONE) {
            if (this.status === 404) {
                createReport('error', this.data.containerID, 'Error 404');
                return;
            }

            if (this.data.initStep) {
                pokemonsCompleteObject = JSON.parse(this.responseText);
                arraySort(pokemonsCompleteObject.results);

                pokemonsCompleteCount = pokemonsCompleteObject.count;

                if (this.data.initStep === 1) {
                    getPokemonsByUrl('', '', '', false, 2);
                } else {
                    const dataObject = pokemonsCompleteObject.results;
                    createOutput(this.data.type, this.data.containerID, dataObject.slice(0, listLength), false);
                }
                return;
            }

            // create output
            createOutput(this.data.type, this.data.containerID, JSON.parse(this.responseText), this.data.isSearchResult);
        }
    });

    xhr.open("GET", url);

    xhr.send(data);
}

/**
 * 
 * @param {String} type list, single, favorites
 * @param {String} containerID the id of the target container for the output
 * @param {JSON} results the data received from xhr call
 */
const createOutput = (type = 'list', containerID = '', results = null, isSearchResult = false) => {
    if (type === 'list') {

        const outputContainer = document.getElementById('outputContainer');
        outputContainer.innerHTML = '';

        const res = [];

        if (isSearchResult) {
            results.url = baseUrlForPokemon + results.id;
            res.push(results);
            results = res;
            outputContainer.innerHTML += '<h3>Search results:</h3>';
        } else {
            //res.results.push(results);
        }

        // create list
        let pokeList = '';
        for (let pokemon of results) {
            pokeList += `
                <li class="flex p-1 text-gray-800 bg-gray-100 rounded border border-gray-800 justify-between items-center">
                    <span>${pokemon.name}</span>
                    <a href="${pokemon.url}" class="pokelink poke-button poke-button-green" onclick="return getPokemonByUrl(event)">view</a>
                </li>
            `;
        }
        outputContainer.innerHTML += `<ul>${pokeList}</ul>`;

        if (!isSearchResult) {
            outputContainer.innerHTML += `
            <div id="pokenext" class="flex justify-between  items-center py-3">
                <p>showing pokemons ${listOffset + 1} to ${listOffset + listLength} of ${pokemonsCompleteCount}</p>
                <div>
                    <a href="#" class="datalink poke-button poke-button-green ${listOffset >= listLength ? 'visible' : 'hidden'}" title="get previous ${listLength}" data-multiplier="-1" onclick="getDatasetPrevNext(event)"><</a>
                    <a href="#" class="datalink poke-button poke-button-green ${(listOffset < pokemonsCompleteCount) ? 'visible' : 'hidden'}" title="get next ${listLength}" data-multiplier="1" onclick="getDatasetPrevNext(event)">></a>
                </div>
            </div>        
        `;
        }
    } else if (type === 'single') {
        const outputContainer = document.getElementById(containerID);
        outputContainer.innerHTML = '';


        // for saving purposes
        currentItem = results;

        outputContainer.innerHTML += `
            <h2 class="text-3xl">${results.name}</h2>
            <div class="grid grid-cols-2">
                <div>
                    <h3 class="text-2xl">aspect</h3>
                    <img src="${results.sprites.front_default}" alt="${results.name}" title="${results.name}">
                </div>
                <div>
                    <h3 class="text-2xl">war cry</h3>
                    <audio controls src="${results.cries.latest}"></audio>
                <div>
            </div>
        `;

        // abilities
        outputContainer.innerHTML += '<h3 class="text-2xl">abilities</h3>'
        let abilityList = '';
        for (let ability of results.abilities) {
            abilityList += `<li>${ability.ability.name}</li>`;
        }
        outputContainer.innerHTML += `<ul class="list-decimal pl-5">${abilityList}</ul>`;

        outputContainer.innerHTML += `
        <div class="flex flex-col">
            <label for="comment">your comment</label>
            <textarea name="comment" id="comment" class="rounded" placeholder="leave a comment">${(results.comment) ? results.comment : ''}</textarea>
            <button 
                id="save-btn" class="remember poke-button poke-button-green" onclick="savePokemonToFavorites(event)">
                    remember / save '${results.name}'
                </button>
        </div>`;
    } else {
        // favorites list

        arraySort(results, listSortBy, listSortOrder);
        // need to refresh the data because when deleting we use the array index
        localStorage.setItem('pokemonobjects', JSON.stringify(results));

        const outputContainer = document.getElementById(containerID);
        outputContainer.innerHTML = '';

        let pokelist = '';
        for (let i in results) {
            // console.log(data[i]);
            const pokemon = results[i];

            const newDate = new Date();
            newDate.setTime(pokemon.timestamp);
            const time = newDate.toLocaleString();

            pokelist += `
                <li class="flex p-1 text-gray-800 bg-gray-100 rounded border border-gray-800 justify-between items-center">
                    <figure class="bg-white rounded relative">
                        <img src="${pokemon.sprites.front_default}" alt="${pokemon.name}" title="${pokemon.name}">
                        <figcaption class="text-sm absolute bottom-0 w-full text-center bg-white bg-opacity-50">${pokemon.name}</figcaption>
                    </figure>
                    <span>saved
                        <time datetime="${time}">${time}</time>
                    </span>
                    <div class="flex">
                        <a class="pokeshow poke-button poke-button-green" href="${baseUrlForPokemon + pokemon.id}" data-id="${i}" onclick="getPokemonFromStorage(event)">view</a>
                        <a class="pokeremove poke-button poke-button-highlight" href="#" data-id="${i}" onclick="removePokemonFromFavorites(event)">remove</a>
                    </div>
                </li>
            `;
        }
        outputContainer.innerHTML += `<ul>${pokelist}</ul>`;
    }

    document.getElementById(containerID).classList.remove('loading');
}

/**
 * 
 * @param {String} type the type of report ('error')
 * @param {String} containerID the ID of the container in which to show the report
 * @param {String} text the text to show
 */
const createReport = (type, containerID, text = 'Error 404') => {
    const outputContainer = document.getElementById(containerID);

    outputContainer.innerHTML = `
        <div class="type-${type}  ${(type === 'error') ? 'bg-red-500 text-white' : 'bg-yellow-200'}  rounded p-3  flex flex-col">
            <h3 class="text-3xl text-center">${type}</h3>
            <p class="text-center">${text}</p>
            <a href="#" id="resetBtn" class="poke-button poke-button-green" onclick="resetList(event)">dismiss</a>
        </div>
    `;
}

/**
 * gets a new dataset as a slice from the loaded pokemonsCompleteObject
 * @param {Event} event called by 'prev' / 'next' buttons (click)
 */
const getDatasetPrevNext = (event) => {
    event.preventDefault();
    document.getElementById('outputContainer').classList.add('loading');

    const multiplier = event.target.dataset.multiplier;
    listOffset += listLength * multiplier;

    createOutput('list', 'outputContainer', pokemonsCompleteObject.results.slice(listOffset, listOffset + listLength));
}

/**
 * loads a pokemon by url via xhr
 * @param {Event} event mouse event (click)
 */
const getPokemonByUrl = (event) => {
    event.preventDefault();
    document.getElementById('detailsContainer').classList.add('loading');
    getPokemonsByUrl('single', 'detailsContainer', event.target.href);
}

/**
 * loads a pokemon from storage
 * @param {Event} event mouse event (click)
 */
const getPokemonFromStorage = (event) => {
    event.preventDefault();

    document.getElementById('detailsContainer').classList.add('loading');

    const id = event.target.dataset.id;
    const pokemonsData = JSON.parse(localStorage.getItem('pokemonobjects')) || [];

    createOutput('single', 'detailsContainer', pokemonsData[id]);
}



/**
 * retrieve  saved pokemons from local storage
 */
const getFavoritePokemons = () => {
    const pokemonsData = JSON.parse(localStorage.getItem('pokemonobjects')) || [];
    createOutput('fav', 'favContainer', pokemonsData);
}

/**
 * remove single pokemon from local storage
 * @param {Event} event mouse event (click)
 * @returns 
 */
const removePokemonFromFavorites = (event) => {

    event.preventDefault();
    const pokeID = event.target.dataset.id;

    // get previous data OR an empty array
    const storageObjects = JSON.parse(localStorage.getItem('pokemonobjects')) || [];

    // remove the pokemon
    storageObjects.splice(pokeID, 1);

    // store the favorite list
    localStorage.setItem('pokemonobjects', JSON.stringify(storageObjects));

    getFavoritePokemons();
}

/**
 * save single pokemon to local storage
 * @param {Event} event mouse event (click)
 * @returns 
 */
const savePokemonToFavorites = (event) => {
    event.preventDefault();


    const pokeID = currentItem.id;
    const pokeName = currentItem.name;

    // Get previous data OR an empty array
    const previousObjects = JSON.parse(localStorage.getItem('pokemonobjects')) || [];

    // no duplicates allowed!
    const elementExists = previousObjects.find((poke) => poke.id === pokeID);
    if (elementExists) {
        elementExists.comment = document.getElementById('comment').value;
        localStorage.setItem('pokemonobjects', JSON.stringify(previousObjects));
        return;
    }

    // add time saved
    currentItem.timestamp = Date.now();
    //add comment
    currentItem.comment = document.getElementById('comment').value;

    // Set item to a stringified version of an array with the new values
    localStorage.setItem('pokemonobjects', JSON.stringify([...previousObjects, currentItem]));

    getFavoritePokemons();
}

/**
 * sorts the list
 * @param {Event} event mouse event (click) 
 */
const sortList = (event) => {
    listSortBy = document.getElementById('sortBySelector').value;
    listSortOrder = document.getElementById('sortOrderSelector').value;

    getFavoritePokemons();
}

/**
 * searches after a pokemon
 * @param {Event} event mouse event (click)
 * @returns 
 */
const searchPokemon = (event) => {
    event.preventDefault();
    const searchTerm = document.getElementById('searchTerm').value;
    if (!searchTerm) {
        console.log('no search term given');
        return;
    }
    console.log('searchTerm = ',searchTerm);
    getPokemonsByUrl('list', 'outputContainer', baseUrlForPokemon + searchTerm, true);
}


/**
 * resets the pokemon list
 * @param {Event} event mouse event (click)
 */
const resetList = (event) => {
    event.preventDefault();
    createOutput('list', 'outputContainer', pokemonsCompleteObject.results.slice(listOffset, listOffset + listLength))
}

/**
 * initializes the dynamic page
 */
const initPage = () => {
    getFavoritePokemons();
    // initial call
    getPokemonsByUrl('', '', '', false, 1);
}

/**
 * sorts (changes) the array by given terms
 * @param {Array} arr the array to sort
 * @param {String} sortBy the term by which to sort the items
 * @param {String} order the sort order ('asc', 'desc')
 * @returns 
 */
const arraySort = (arr = [], sortBy = 'name', order = 'asc') => {
    if (order === 'asc') {
        return arr.sort((a, b) => (a[sortBy] > b[sortBy]) ? 1 : ((b[sortBy] > a[sortBy]) ? -1 : 0));
    } else {
        return arr.sort((b, a) => (a[sortBy] > b[sortBy]) ? 1 : ((b[sortBy] > a[sortBy]) ? -1 : 0));
    }
}

/**
 * waits for the window to load before initializing page
 */
const loadListener = window.addEventListener('load', () => {
    if (!isInitializedPage) {
        initPage();
        isInitializedPage = true;
    }
}, false);
