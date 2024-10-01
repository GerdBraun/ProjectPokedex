/**
 * ToDos
 * 
 * filter list, sort list
 * 
 * HTMLCollection use this for iterating "htmlcoll.foreach(elem, index)"
 * document.body
 * array.foreach
 * 
 * use fetch instead of xhr ???
 * 
 * own addToStorage
 * 
 * const addToStorage = (key,value){
 *      localStorage.setItem(key, JSON.stringify(value))
 * }
 */



/* 
// fetch example
fetch('https://pokeapi.co/api/v2/pokemon/')
  .then(response => response.json())
  .then(data => console.log(data))
  .catch(error => console.error('Error:', error));

 */

/**
 * 
 * @param {String} type list, single, favorites
 * @param {String} containerID the id of the target container for the output
 * @param {JSON} results the data received from xhr call
 */
const createOutput = (type = 'list', containerID = '', results = null, isSearchResult = false) => {
    const outputContainer = document.querySelector('#' + containerID);
    outputContainer.innerHTML = '';

    if (type === 'list') {
        const res = [];

        if (isSearchResult) {
            results.url = page.baseUrlForPokemon + results.id;
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
                <li class="draggable flex p-2 pl-3 text-gray-800 bg-white rounded shadow mb-1 justify-between items-center cursor-move" data-url="${pokemon.url}" draggable="true" ondragstart="page.pokemonlist.dragstartHandler(event)">
                    <span>${pokemon.name}</span>
                    <img src="images/drag.svg" class="w-4">
                    <!--
                    <a href="${pokemon.url}" class="pokelink poke-button poke-button-green" onclick="return page.single.getByUrl(event)">view</a>
                    -->
                </li>
            `;
        }
        outputContainer.innerHTML += `<ul>${pokeList}</ul>`;

        if (!isSearchResult) {
            let toCount = page.pokemonlist.listOffset + page.pokemonlist.listLength;
            toCount = (toCount > page.pokemonlist.pokemonsCompleteCount) ? page.pokemonlist.pokemonsCompleteCount : toCount;
            outputContainer.innerHTML += `
            <div id="pokenext" class="flex justify-between  items-center py-3">
                <p>showing pokemons ${page.pokemonlist.listOffset + 1} to ${toCount} of ${page.pokemonlist.pokemonsCompleteCount}</p>
                <div>
                    <a href="#" class="datalink poke-button poke-button-green ${page.pokemonlist.listOffset >= page.pokemonlist.listLength ? 'visible' : 'hidden'}" title="get previous ${page.pokemonlist.listLength}" data-multiplier="0" onclick="page.pokemonlist.getPrevNext(event)">&#8676;</a>
                    <a href="#" class="datalink poke-button poke-button-green ${page.pokemonlist.listOffset >= page.pokemonlist.listLength ? 'visible' : 'hidden'}" title="get previous ${page.pokemonlist.listLength}" data-multiplier="-1" onclick="page.pokemonlist.getPrevNext(event)">&#8592;</a>
                    <a href="#" class="datalink poke-button poke-button-green ${(page.pokemonlist.pokemonsCompleteCount > page.pokemonlist.listOffset + page.pokemonlist.listLength) ? 'visible' : 'hidden'}" title="get next ${page.pokemonlist.listLength}" data-multiplier="1" onclick="page.pokemonlist.getPrevNext(event)">&#8594;</a>
                    <a href="#" class="datalink poke-button poke-button-green ${(page.pokemonlist.pokemonsCompleteCount > page.pokemonlist.listOffset + page.pokemonlist.listLength) ? 'visible' : 'hidden'}" title="get next ${page.pokemonlist.listLength}" data-multiplier="x" onclick="page.pokemonlist.getPrevNext(event)">&#8677;</a>
                </div>
            </div>        
        `;
        }
    } else if (type === 'single') {
        // for saving purposes
        page.single.storedPokemon = results;

        outputContainer.innerHTML += `
            <h2 class="text-3xl">${results.name} <span class="">${results.timestamp ? '(favorite)' : ''}</span></h2>
            <div class="md:grid md:grid-cols-2">
                <div>
                    <h3 class="text-2xl">aspect</h3>
                    <img src="${results.sprites.front_default}" alt="${results.name}" title="${results.name}">
                </div>
                <div>
                    <h3 class="text-2xl">war cry</h3>
                    <audio controls src="${results.cries.latest}" class="max-w-28"></audio>
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
                id="save-btn" class="remember poke-button poke-button-green" onclick="page.favorites.addSingle(event)">
                    remember / save '${results.name}'
                </button>
        </div>`;
    } else {
        // favorites list

        page.pokemonlist.sort(results, page.favorites.listSortBy, page.favorites.listSortOrder);
        // need to refresh the data because when deleting we use the array index
        localStorage.setItem('pokemonobjects', JSON.stringify(results));

        let pokelist = '';
        for (let i in results) {
            // console.log(data[i]);
            const pokemon = results[i];

            const newDate = new Date();
            newDate.setTime(pokemon.timestamp);
            const time = newDate.toLocaleString();

            pokelist += `
                <li class="flex p-2 text-gray-800 bg-white rounded shadow mb-1 justify-between items-center" >
                    <figure class="bg-white rounded relative">
                        <img src="${pokemon.sprites.front_default}" alt="${pokemon.name}" title="${pokemon.name}">
                        <figcaption class="text-sm absolute bottom-0 w-full text-center bg-white bg-opacity-50">${pokemon.name}</figcaption>
                    </figure>
                    <span>saved
                        <time datetime="${time}">${time}</time>
                    </span>
                    <div class="flex">
                        <a class="pokeshow poke-button poke-button-green" href="${page.baseUrlForPokemon + pokemon.id}" data-id="${i}" onclick="page.favorites.getSingle(event)">view</a>
                        <a class="pokeremove poke-button poke-button-highlight" href="#" data-id="${i}" onclick="page.favorites.removeSingle(event)">remove</a>
                    </div>
                </li>
            `;
        }
        outputContainer.innerHTML += `<ul>${pokelist}</ul>`;
    }

    document.querySelector('#' + containerID).classList.remove('loading');
}




/**
 * waits for the window to load before initializing page
 */
const loadListener = window.addEventListener('DOMContentLoaded', () => {
    console.log('DOMContentLoaded');
    page.initialize();

}, false);


/**
 * fitting everything into a page object
 */


/**
 * the object containing anythig related to logic
 */
const page = {
    /**
     * the base-url for xhr calls
     */
    baseUrlForPokemon: 'https://pokeapi.co/api/v2/pokemon/',


    /**
     * initialize the page
     */
    initialize: () => {
        console.log('called: page.initialize');

        page.favorites.getList();

        const urlParams = new URLSearchParams(window.location.search);
        if (urlParams && urlParams.get('searchTerm') && urlParams.get('searchTerm') !== '') {
            document.querySelector('#searchTerm').value = urlParams.get('searchTerm');
            page.pokemonlist.search(event);
            return;
        }

        // make the initial call
        page.pokemonlist.getByUrl('', '', '', false, 1);
    },

    /**
     * opens THE modal window
     * @param {String} type 
     * @param {String} title 
     * @param {String} content 
     */
    openModal: (type = '', title = 'no title given', content = 'no  content given') => {
        const modal = document.querySelector('#defaultModal');
        const modalTitle = modal.querySelector('h3');
        const modalText = modal.querySelector('.modal-text');

        switch (type) {
            case 'warning':
                modalTitle.classList.add('text-orange-500');
                break;
            case 'error':
                modalTitle.classList.add('text-red-500');
                break;
            default:
                modalTitle.classList.add('text-gray-900');
        }

        modalText.innerHTML = content;
        modalTitle.textContent = title;
        modal.classList.remove('hidden');
    },
    /**
     * closes THE modalwindow
     */
    closeModal: () => {
        document.querySelector('#defaultModal').classList.add('hidden');
    },

    pokemonlist: {
        /**
         * vars used for displaying the pokemon list
         */
        // starting point for retrieving data
        listOffset: 0,
        // the number of pokemons to be displayed in the list
        listLength: 10,
        // the total number of pokemons available
        pokemonsCompleteCount: 0,
        // the complete object of pokemons retrieved by xhr
        pokemonsCompleteObject: {},

        /**
         * retrieves pokemon list
         * @param {String} type 
         * @param {String} containerID 
         * @param {String} url 
         * @param {Boolean} isSearchResult 
         * @param {Number} initStep 
         */
        getByUrl: (type, containerID, url, isSearchResult = false, initStep = 0) => {
            console.log('called: page.pokemonlist.getByUrl');
            if (initStep > 0) {
                switch (initStep) {
                    case 1:
                        // load one pokemon to get the total number of entries
                        url = page.baseUrlForPokemon + '?offset=0&limit=1';
                    case 2:
                        // load the complete list of pokemons available
                        url = page.baseUrlForPokemon + '?offset=0&limit=' + page.pokemonlist.pokemonsCompleteCount;
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
                        page.openModal('error', 'Error 404: Pokemon not found', 'We could not find such a Pokemon!');
                        return;
                    }

                    if (this.data.initStep) {
                        page.pokemonlist.pokemonsCompleteObject = JSON.parse(this.responseText);
                        page.pokemonlist.sort(page.pokemonlist.pokemonsCompleteObject.results);

                        page.pokemonlist.pokemonsCompleteCount = page.pokemonlist.pokemonsCompleteObject.count;

                        if (this.data.initStep === 1) {
                            page.pokemonlist.getByUrl('', '', '', false, 2);
                        } else {
                            const dataObject = page.pokemonlist.pokemonsCompleteObject.results;
                            createOutput(this.data.type, this.data.containerID, dataObject.slice(0, page.pokemonlist.listLength), false);
                        }
                        return;
                    }

                    // create output
                    createOutput(this.data.type, this.data.containerID, JSON.parse(this.responseText), this.data.isSearchResult);
                }
            });

            xhr.open("GET", url);

            xhr.send(data);
        },

        /**
        * gets a new dataset as a slice from the loaded pokemonsCompleteObject
        * @param {Event} event called by 'prev' / 'next' buttons (click)
        */
        getPrevNext: (event) => {
            console.log('called: page.pokemonlist.getPrevNext');
            event.preventDefault();
            document.querySelector('#outputContainer').classList.add('loading');

            const multiplier = event.target.dataset.multiplier;
            if (multiplier === '0') {
                page.pokemonlist.listOffset = 0;
            } else if (multiplier === 'x') {
                // page.pokemonlist.listOffset = page.pokemonlist.pokemonsCompleteCount % page.pokemonlist.listLength;
                page.pokemonlist.listOffset = Math.floor(page.pokemonlist.pokemonsCompleteCount / page.pokemonlist.listLength) * page.pokemonlist.listLength;
            } else {
                page.pokemonlist.listOffset += page.pokemonlist.listLength * multiplier;
            }

            createOutput('list', 'outputContainer', page.pokemonlist.pokemonsCompleteObject.results.slice(page.pokemonlist.listOffset, page.pokemonlist.listOffset + page.pokemonlist.listLength));
        },

        /**
        * searches after a pokemon
        * @param {Event} event mouse event (click)
        * @returns 
        */
        search: (event) => {
            console.log('called: page.pokemonlist.search');
            event.preventDefault();
            const searchTerm = document.querySelector('#searchTerm').value;
            if (!searchTerm) {
                console.log('no search term given');
                return;
            }
            console.log('searchTerm = ', searchTerm);
            page.pokemonlist.getByUrl('list', 'outputContainer', page.baseUrlForPokemon + searchTerm, true);
        },

        /**
          * sorts (changes) the array by given terms
          * @param {Array} arr the array to sort
          * @param {String} sortBy the term by which to sort the items
          * @param {String} order the sort order ('asc', 'desc')
          * @returns 
          */
        sort: (arr = [], sortBy = 'name', order = 'asc') => {
            if (order === 'asc') {
                return arr.sort((a, b) => (a[sortBy] > b[sortBy]) ? 1 : ((b[sortBy] > a[sortBy]) ? -1 : 0));
            } else {
                return arr.sort((b, a) => (a[sortBy] > b[sortBy]) ? 1 : ((b[sortBy] > a[sortBy]) ? -1 : 0));
            }
        },

        /**
         * handles the beginning of a drag action
         * @param {Event} event 
         */
        dragstartHandler: (event) => {
            // Add the target element's url to the data transfer object
            console.log('starting drag with url = ', event.target.dataset.url);
            event.dataTransfer.setData("text/plain", event.target.dataset.url);
        },
    },

    single: {
        // storage for the currently selected pokemon object; this object will be saved as a favorite
        storedPokemon: {},
        type: 'single',
        container: 'detailsContainer',

        /**
         * loads a pokemon by url via xhr
         * @param {*} input mouse event (click) or string (url)
         */
        getByUrl: (input) => {
            console.log('called: page.single.getByUrl');
            let href = '';
            console.log(typeof input);
            if (typeof input === 'string') {
                href = input;
            } else {
                // input is Event
                input.preventDefault();
                href = event.target.href;

            }

            document.querySelector('#' + page.single.container).classList.add('loading');
            page.pokemonlist.getByUrl(page.single.type, page.single.container, href);
        },


        allowDrop: (event) => {
            event.preventDefault();
            event.currentTarget.classList.add('bg-green-100');
        },

        dragOver: (event) => {
            event.currentTarget.classList.add('bg-green-100');
        },

        dragOut: (event) => {
            event.currentTarget.classList.remove('bg-green-100');
        },

        drop: (event) => {
            event.preventDefault();
            event.currentTarget.classList.remove('bg-green-100');
            var data = event.dataTransfer.getData("url");
            console.log('dropped: ', data);
            event.currentTarget.classList.remove('bg-green-100');
            page.single.getByUrl(data);
        },
    },

    favorites: {
        // values for sorting
        listSortBy: 'timestamp',
        listSortOrder: 'desc',
        type: 'fav',
        container: 'favContainer',
        list: [],

        /**
         * save single pokemon to local storage
         * @param {Event} event mouse event (click)
         * @returns 
         */
        addSingle: (event) => {
            console.log('called: page.favorites.addSingle');
            event.preventDefault();


            const pokeID = page.single.storedPokemon.id;
            const pokeName = page.single.storedPokemon.name;

            // Get previous data OR an empty array
            const previousObjects = JSON.parse(localStorage.getItem('pokemonobjects')) || [];

            // add time saved
            page.single.storedPokemon.timestamp = Date.now();
            //add comment
            page.single.storedPokemon.comment = document.querySelector('#comment').value || '';

            // no duplicates allowed!
            const elementExists = previousObjects.find((poke) => poke.id === pokeID);
            if (elementExists) {
                elementExists.comment = document.querySelector('#comment').value;
                localStorage.setItem('pokemonobjects', JSON.stringify(previousObjects));
                return;
            }

            // Set item to a stringified version of an array with the new values
            localStorage.setItem('pokemonobjects', JSON.stringify([...previousObjects, page.single.storedPokemon]));

            page.favorites.getList();
        },
        /**
         * remove single pokemon from local storage
         * @param {Event} event mouse event (click)
         * @returns 
         */
        removeSingle: (event) => {
            console.log('called: page.favorites.removeSingle');

            event.preventDefault();
            const pokeID = event.target.dataset.id;

            // get previous data OR an empty array
            const storageObjects = JSON.parse(localStorage.getItem('pokemonobjects')) || [];

            // remove the pokemon
            storageObjects.splice(pokeID, 1);

            // store the favorite list
            localStorage.setItem('pokemonobjects', JSON.stringify(storageObjects));

            page.favorites.getList();
        },

        /**
         * get the list of pokemons from local storage
         */
        getList: () => {
            console.log('called: page.favorites.getList');
            const pokemonsData = JSON.parse(localStorage.getItem('pokemonobjects')) || [];
            page.favorites.list = pokemonsData;
            createOutput(page.favorites.type, page.favorites.container, pokemonsData);
        },

        /**
         * loads a pokemon from storage
         * @param {Event} event mouse event (click)
         */
        getSingle: (event) => {
            console.log('called: page.favorites.getSingle');
            event.preventDefault();

            document.querySelector('#' + page.favorites.container).classList.add('loading');

            const id = event.target.dataset.id;
            //const pokemonsData = JSON.parse(localStorage.getItem('pokemonobjects')) || [];

            createOutput('single', 'detailsContainer', page.favorites.list[id]);
        },

        /**
         * sorts the list
         * @param {Event} event mouse event (click) 
         */
        sort: (event) => {
            console.log('called: page.favorites.sort');
            // get the sorting params
            page.favorites.listSortBy = document.querySelector('#sortBySelector').value;
            page.favorites.listSortOrder = document.querySelector('#sortOrderSelector').value;

            page.favorites.getList();
        },

        /**
        * sorts (changes) the array by given terms
        * @param {Array} arr the array to sort
        * @param {String} sortBy the term by which to sort the items
        * @param {String} order the sort order ('asc', 'desc')
        * @returns 
        */
        arraySort: (arr = [], sortBy = 'name', order = 'asc') => {
            if (order === 'asc') {
                return arr.sort((a, b) => (a[sortBy] > b[sortBy]) ? 1 : ((b[sortBy] > a[sortBy]) ? -1 : 0));
            } else {
                return arr.sort((b, a) => (a[sortBy] > b[sortBy]) ? 1 : ((b[sortBy] > a[sortBy]) ? -1 : 0));
            }
        },
    }
}

// for further use...
const helpers = {
    storage: {
        addToStorage: (key, value) => {
            return localStorage.setItem(key, JSON.stringify(value))
        },
        getFromStorage: (key)  => {
            return JSON.parse(localStorage.getItem(key));
        },
        addToExisting:(key,value) => {
            
        }
    },
}