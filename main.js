/**
 * ToDos
 * filter list, sort list
 */


/**
 * status of the page (used for preventing multiple page initialization on window.load)
 */
let isInitializedPage = false;


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
                <li class="flex p-1 text-gray-800 bg-gray-100 rounded border border-gray-800 justify-between items-center">
                    <span>${pokemon.name}</span>
                    <a href="${pokemon.url}" class="pokelink poke-button poke-button-green" onclick="return page.single.getByUrl(event)">view</a>
                </li>
            `;
        }
        outputContainer.innerHTML += `<ul>${pokeList}</ul>`;

        if (!isSearchResult) {
            outputContainer.innerHTML += `
            <div id="pokenext" class="flex justify-between  items-center py-3">
                <p>showing pokemons ${page.pokemonlist.listOffset + 1} to ${page.pokemonlist.listOffset + page.pokemonlist.listLength} of ${page.pokemonlist.pokemonsCompleteCount}</p>
                <div>
                    <a href="#" class="datalink poke-button poke-button-green ${page.pokemonlist.listOffset >= page.pokemonlist.listLength ? 'visible' : 'hidden'}" title="get previous ${page.pokemonlist.listLength}" data-multiplier="-1" onclick="page.pokemonlist.getPrevNext(event)"><</a>
                    <a href="#" class="datalink poke-button poke-button-green ${(page.pokemonlist.listOffset < page.pokemonlist.pokemonsCompleteCount) ? 'visible' : 'hidden'}" title="get next ${page.pokemonlist.listLength}" data-multiplier="1" onclick="page.pokemonlist.getPrevNext(event)">></a>
                </div>
            </div>        
        `;
        }
    } else if (type === 'single') {
        // for saving purposes
        page.single.storedPokemon = results;

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
                <li class="flex p-1 text-gray-800 bg-gray-100 rounded border border-gray-800 justify-between items-center">
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
const loadListener = window.addEventListener('load', () => {
    if (!isInitializedPage) {
        page.initialize();
        isInitializedPage = true;
    }
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

        // make the initial call
        page.pokemonlist.getByUrl('', '', '', false, 1);
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
                        page.pokemonlist.createReport('error', this.data.containerID, 'Error 404');
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
            page.pokemonlist.listOffset += page.pokemonlist.listLength * multiplier;

            createOutput('list', 'outputContainer', page.pokemonlist.pokemonsCompleteObject.results.slice(page.pokemonlist.listOffset, page.pokemonlist.listOffset + page.pokemonlist.listLength));
        },

        /**
           * resets the pokemon list
           * @param {Event} event mouse event (click)
           */
        reset: (event = null) => {
            console.log('called: page.pokemonlist.reset');
            event.preventDefault();
            if(event.target.dataset.complete){
                page.pokemonlist.listOffset = 0;
            }
            createOutput('list', 'outputContainer', page.pokemonlist.pokemonsCompleteObject.results.slice(page.pokemonlist.listOffset, page.pokemonlist.listOffset + page.pokemonlist.listLength))
        },

        /**
         * creates a report in given container
         * @param {String} type the type of report ('error')
         * @param {String} containerID the ID of the container in which to show the report
         * @param {String} text the text to show
         */
        createReport: (type, containerID, text = 'Error 404') => {
            console.log('called: page.pokemonlist.createReport');
            const outputContainer = document.querySelector('#' + containerID);

            outputContainer.innerHTML = `
                <div class="type-${type}  ${(type === 'error') ? 'bg-red-500 text-white' : 'bg-yellow-200'}  rounded p-3  flex flex-col">
                    <h3 class="text-3xl text-center">${type}</h3>
                    <p class="text-center">${text}</p>
                    <a href="#" id="resetBtn" class="poke-button poke-button-green" onclick="page.pokemonlist.reset(event)">dismiss</a>
                </div>
            `;
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
    },

    single: {
        // storage for the currently selected pokemon object; this object will be saved as a favorite
        storedPokemon: {},
        type: 'single',
        container: 'detailsContainer',

        /**
         * loads a pokemon by url via xhr
         * @param {Event} event mouse event (click)
         */
        getByUrl: (event) => {
            console.log('called: page.single.getByUrl');
            event.preventDefault();
            document.querySelector('#' + page.single.container).classList.add('loading');
            page.pokemonlist.getByUrl(page.single.type, page.single.container, event.target.href);
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