
// variables
let currentOffset = 0;
let currentLimit = 10;
let sortBy = 'timestamp';
let sortOrder = 'desc';
let currentItem = {};

const baseUrlForPokemon = 'https://pokeapi.co/api/v2/pokemon/';


/**
 * retrieves p
 * @param {String} type 
 * @param {String} containerID 
 * @param {String} url 
 */
const getPokemonsByUrl = (type, containerID, url, isSearchResult = false) => {
    const data = '';
    const xhr = new XMLHttpRequest();
    xhr.withCredentials = false;

    // pass needed  data to xhr
    xhr.data = {
        type: type,
        containerID: containerID,
        isSearchResult: isSearchResult,
    };

    xhr.addEventListener("readystatechange", function (x) {
        if (this.readyState === this.DONE) {
            console.log(this);

            if (this.status === 404) {
                createReport('error', this.data.containerID, 'Error 404');
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

        let res = {
            results: [],
            url: ''
        };

        if (isSearchResult) {
            results.url = baseUrlForPokemon + results.id;
            res.results.push(results);
            outputContainer.innerHTML += '<h3>Search results:</h3>';
        } else {
            res = results;
        }

        // create list
        let pokeList = '';
        for (let pokemon of res.results) {
            pokeList += `
                <li class="flex p-1 text-gray-800 bg-gray-100 rounded border border-gray-800">
                    <a href="${pokemon.url}" class="pokelink">${pokemon.name}</a>
                </li>
            `;
        }
        outputContainer.innerHTML += `<ul>${pokeList}</ul>`;

        if (!isSearchResult) {
            outputContainer.innerHTML += `
            <div id="pokenext" class="flex justify-between  items-center py-3">
                <p>showing pokemons ${currentOffset + 1} to ${currentOffset + currentLimit} of ${results.count}</p>
                <div>
                    <a href="${results.previous}" id="previouslink" class="datalink poke-button poke-button-green ${results.previous ? 'visible' : 'hidden'} previous" title="previous ${currentLimit}"><</a>
                    <a href="${results.next}" id="nextlink" class="datalink poke-button poke-button-green ${results.next ? 'visible' : 'hidden'} next" title="next ${currentLimit}">></a>
                </div>
            </div>        
        `;
        }

        initPokeLinks();
        initDataLinks();

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
        let abilityList = '';
        for (let ability of results.abilities) {
            abilityList += `<li>${ability.ability.name}</li>`;
        }
        outputContainer.innerHTML += `<ul>${abilityList}</ul>`;

        outputContainer.innerHTML += `
        <div class="flex flex-col">
            <label for="comment">your comment</label>
            <textarea name="comment" id="comment" class="rounded">${results.comment}</textarea>
            <button 
                id="save-btn" 
                value="${results.id}" 
                class="remember poke-button poke-button-green" 
                data-name="${results.name}" 
                data-id="${results.id}" 
                data-url="${baseUrlForPokemon + results.id}" 
                data-img="${results.sprites.front_default}">
                    remember ${results.name}
                </button>
        </div>`;

        initSaveButton();
    } else {
        // favorites list
        
        arraySort(results, sortBy, sortOrder);

        // need to refresh the data because when deleting we use the array index
        localStorage.setItem('pokemonlist', JSON.stringify(results));

        const outputContainer = document.getElementById(containerID);
        outputContainer.innerHTML = '';
        //console.log(data);

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
                        <img src="${pokemon.img}" alt="${pokemon.name}" title="${pokemon.name}">
                        <figcaption class="text-sm absolute bottom-0 w-full text-center bg-white bg-opacity-50">${pokemon.name}</figcaption>
                    </figure>
                    <span>saved ${time}</span>
                    <div class="flex">
                        <a class="pokelink poke-button poke-button-green" href="${pokemon.url}">view</a>
                        <a class="pokeremove poke-button poke-button-highlight" href="#" data-id="${i}">remove</a>
                    </div>
                </li>
            `;
        }
        outputContainer.innerHTML += `<ul>${pokelist}</ul>`;

        initPokeLinks();
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
        <div class="type-${type}  ${(type==='error') ? 'bg-red-500 text-white'  : 'bg-yellow-200' }  rounded p-3  flex flex-col">
            <h3 class="text-3xl text-center">${type}</h3>
            <p class="text-center">${text}</p>
            <a href="#" id="resetBtn" class="poke-button poke-button-green">dismiss</a>
        </div>
    `;
    initResetButton();
}

/**
 * loads a new dataset by url via xhr
 * @param {Event} event 
 */
const loadDataSetByUrl = (event) => {
    event.preventDefault();
    document.getElementById('outputContainer').classList.add('loading');
    getPokemonsByUrl('list', 'outputContainer', event.target.href);

    if (event.target.classList.contains('next')) {
        currentOffset += currentLimit;
    } else {
        currentOffset -= currentLimit;
    }
}

/**
 * loads a pokemon by url via xhr
 * @param {Event} event 
 */
const getPokemonByUrl = (event) => {
    event.preventDefault();
    document.getElementById('detailsContainer').classList.add('loading');
    getPokemonsByUrl('single', 'detailsContainer', event.target.href);
}



/**
 * retrieve  saved pokemons from local storage
 */
const getFavoritePokemons = () => {
    const previousData = JSON.parse(localStorage.getItem('pokemonlist')) || [];
    createOutput('fav', 'favContainer', previousData);
}

/**
 * remove single pokemon from local storage
 * @param {Event} event 
 * @returns 
 */
const removePokemon = (event) => {
    console.log(event.target);

    event.preventDefault();
    const pokeID = event.target.dataset.id;

    // Get previous data OR an empty array
    const storageData = JSON.parse(localStorage.getItem('pokemonlist')) || [];

    // remove the pokemon
    storageData.splice(pokeID, 1);

    // Set item to a stringified version of an array with the old and new tasks
    localStorage.setItem('pokemonlist', JSON.stringify(storageData));

    getFavoritePokemons();
}

/**
 * save single pokemon to local storage
 * @param {Event} event 
 * @returns 
 */
const savePokemon = (event) => {
    event.preventDefault();


    const pokeID = event.target.dataset.id;
    const pokeName = event.target.dataset.name;

    // Get previous data OR an empty array
    const previousData = JSON.parse(localStorage.getItem('pokemonlist')) || [];
    const previousObjects = JSON.parse(localStorage.getItem('pokemonobjects')) || [];
    // no duplicates allowed!
    if (previousData.some((poke) => poke.id === pokeID)) {
        //alert(pokeName + ' is already in your list')
        return;
    } else {
        //alert(pokeName + ' has been remembered')
    }

    // the data to save (stored in button)
    const pokeData = event.target.dataset;

    // add time saved
    pokeData.timestamp = Date.now();
    //add comment
    pokeData.comment = document.getElementById('comment').value;

    // add time saved
    previousObjects.timestamp = Date.now();
    //add comment
    previousObjects.comment = document.getElementById('comment').value;

    // Set item to a stringified version of an array with the old and new tasks
    localStorage.setItem('pokemonlist', JSON.stringify([...previousData, pokeData]));
    localStorage.setItem('pokemonobjects', JSON.stringify([...previousObjects, currentItem]));

    getFavoritePokemons();
}

/**
 * initialize the save button
 */
const initSaveButton = () => {
    document.getElementById('save-btn').addEventListener('click', savePokemon, false);
}

/**
 * initialize the prev / next buttons
 */
const initDataLinks = () => {
    // apply functions to the prev & next links
    const dataLinks = document.getElementsByClassName("datalink");
    for (let i = 0; i < dataLinks.length; i++) {
        dataLinks[i].addEventListener('click', loadDataSetByUrl, false);
    }
}

/**
 * initialize sorting options
 */
const initSortingSelects = () => {
    const sortingSelects = document.getElementsByClassName("sortBy");
    for (let i = 0; i < sortingSelects.length; i++) {
        sortingSelects[i].addEventListener('change', (event) => {
            sortBy = document.getElementById('sortBySelector').value;
            sortOrder = document.getElementById('sortOrderSelector').value;
            getFavoritePokemons();
        }, false);
    }
}

/**
 * initializes the links for the detail view
 */
const initPokeLinks = () => {
    const pokeLinks = document.getElementsByClassName("pokelink");
    for (let i = 0; i < pokeLinks.length; i++) {
        pokeLinks[i].addEventListener('click', getPokemonByUrl, false);
    }
    const pokeRemoves = document.getElementsByClassName("pokeremove");
    for (let i = 0; i < pokeRemoves.length; i++) {
        pokeRemoves[i].addEventListener('click', removePokemon, false);
    }
}

/**
 * initializes the search
 */
const initSearch = () => {
    document.getElementById('searchBtn').addEventListener('click', (event) => {
        const searchTerm = document.getElementById('searchTerm').value;
        if (!searchTerm) {
            console.log('no search term');
            return;
        }
        console.log(searchTerm);
        getPokemonsByUrl('list', 'outputContainer', baseUrlForPokemon + searchTerm, true);
    }, false);
}

const initResetButton = () => {
    document.getElementById('resetBtn').addEventListener('click', (event) => {
        event.preventDefault();
        console.log('yep');
        getPokemonsByUrl('list', 'outputContainer', 'https://pokeapi.co/api/v2/pokemon/?offset=' + currentOffset + '&limit=' + currentLimit);
    }, false)
}

/**
 * initializes the dynamic page
 */
const initPage = () => {
    getFavoritePokemons();
    initSearch();
    initSortingSelects();

    // initial call
    getPokemonsByUrl('list', 'outputContainer', 'https://pokeapi.co/api/v2/pokemon/?offset=' + currentOffset + '&limit=' + currentLimit);
}

/**
 * sorts arrays by given terms
 * @param {Array} arr the array to sort
 * @param {String} sortBy the term by which to sort the items
 * @param {String} order the sort order
 * @returns 
 */
const arraySort = (arr = [], sortBy = 'name', order = 'asc') => {
    if (order === 'asc') {
        return arr.sort((a, b) => (a[sortBy] > b[sortBy]) ? 1 : ((b[sortBy] > a[sortBy]) ? -1 : 0));
    } else {
        return arr.sort((b, a) => (a[sortBy] > b[sortBy]) ? 1 : ((b[sortBy] > a[sortBy]) ? -1 : 0));
    }
}
