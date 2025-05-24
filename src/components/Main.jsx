/* eslint-disable no-unused-vars */
import { useState, useEffect } from "react"
import useLocalStorage from "use-local-storage";
import { SwatchesPicker } from "react-color"
import { ReactSortable } from 'react-sortablejs';
import LZString from 'lz-string';

export default function Main() {

    const [animeData, setAnimeData] = useState([])
    const [searchQuery, setSearchQuery] = useState("")
    const [currentPage, setCurrentPage] = useState(1)
    const [hasNextPage, setHasNextPage] = useState(false)
    const [hoveredIndex, setHoveredIndex] = useState(null)
    const [tierHoveredIndex, setTierHoveredIndex] = useState(null)
    const [draggedAnime, setDraggedAnime] = useState({
        anime: null,
        source: null // 'sidebar' or 'tier'
    })
    const [auth, setAuth] = useLocalStorage("auth", {token: null, id: null, name: null})
    const [animeDataFromSearch, setAnimeDataFromSearch] = useState(true)
    const [shareModal, setShareModal] = useState(false)
    const [savedLists, setSavedLists] = useLocalStorage("savedlists", [])
    const [loadListModal, setLoadListModal] = useState(false)
    const [saveListModal, setSaveListModal] = useState(false)
    const [newListName, setNewListName] = useState("")

    function getAnimesFromSearch(page = 1) {
        if (searchQuery == "") {
            setAnimeData([])
            return
        }
        const url = "https://graphql.anilist.co"
        const query = `
            query ($search: String!, $page: Int = 1) {
                Page (page: $page) {
                    pageInfo {
                        hasNextPage
                    }
                    media(search: $search, type: ANIME) {
                        id
                        coverImage {
                            large
                        }
                        title {
                            romaji
                            english
                        }
                    }
                }
            }
        `
        const variables = {search: searchQuery, page: page}

        const options = {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json',
            },
            body: JSON.stringify({
                query: query,
                variables: variables
            })
        };

        fetch(url, options).then(async (response) => {
            if (response.ok) {
                const json = await response.json()
                const anime = json.data.Page.media
                setAnimeData(anime)
                setHasNextPage(json.data.Page.pageInfo.hasNextPage)
                setCurrentPage(page)
                setAnimeDataFromSearch(true)
            }
        })
    }

    function getUserAnimeList(page = 1) {
        const url = "https://graphql.anilist.co"
        const query = `
            query ($userId: Int!) {
                MediaListCollection(type: ANIME, userId: $userId) {
                    lists {
                        name
                        entries {
                            id
                            media {
                                id
                                title {
                                    romaji
                                    english
                                }
                                coverImage {
                                    large
                                }
                            }
                        }
                    }
                }
            }
        `
        const variables = {userId: auth.id}

        const options = {
            method: 'POST',
            headers: {
                'Authorization': 'Bearer ' + auth.token,
                'Content-Type': 'application/json',
                'Accept': 'application/json',
            },
            body: JSON.stringify({
                query: query,
                variables: variables
            })
        };

        fetch(url, options).then(async (response) => {
            if (response.ok) {
                const json = await response.json()
                const animeLists = json.data.MediaListCollection.lists

                let data = []

                for (let i = 0 ; i<animeLists.length; i++) {
                    for (let j = 0; j<animeLists[i].entries.length; j++) {
                        const entry = animeLists[i].entries[j]
                        const media = animeLists[i].entries[j].media
                        const animeEntry = {id: entry.id, ...media}
                        data.push(animeEntry)
                    }
                }


                let pages = []
                let currentPage = []

                for (let i = 0; i<data.length; i++) {
                    if (i % 50 == 0 && i != 0) {
                        pages.push(currentPage)
                        currentPage = []
                    }
                    currentPage.push(data[i])
                }
                pages.push(currentPage)

                setAnimeData(pages[page-1])
                setHasNextPage(pages.length > page)
                setCurrentPage(page)
                setAnimeDataFromSearch(false)
            }
        })
    }

    function triggerSearch(event) {
        if (event.key == "Enter") {
            setSearchQuery(document.querySelector("#anime-search-query")?.value)
        }
    }


    const initialTierList = [
        {
            name: "S",
            color: "#ff5757",
            animes: []
        },
        {
            name: "A",
            color: "#ffbd59",
            animes: []
        },
        {
            name: "B",
            color: "#70ff66",
            animes: []
        },
        {
            name: "C",
            color: "#5e9eff",
            animes: []
        },
        {
            name: "D",
            color: "#c07dff",
            animes: []
        },
        {
            name: "F",
            color: "#795548",
            animes: []
        },
    ]


    const [tierList, setTierList] = useLocalStorage('tierlist', initialTierList)
    const [modalState, setModalState] = useState(false)
    const [newTierName, setNewTierName] = useState("Unknown")
    const [newTierColor, setNewTierColor] = useState("#fff")
    const [tierListName, setTierListName] = useLocalStorage('tierlistname', "My Anime Tier List")

    function addTier() {
        setTierList(prevTierList => [
            ...prevTierList,
            {
                name: newTierName,
                color: newTierColor,
                animes: []
            }
        ]);
        setModalState(false)
    }

    function deleteTier(index) {
        setTierList(prevTierList => {
            const newTierList = [...prevTierList];
            newTierList.splice(index, 1);
            return newTierList;
        });
    }

    function deleteFromTier(tierIndex, anime, e) {
        e.stopPropagation(); // Stop event from bubbling up
        e.preventDefault();  // Prevent default behavior (just in case)

        setTierList(prevTierList => {
            const newTierList = [...prevTierList];
            newTierList[tierIndex].animes = newTierList[tierIndex].animes.filter(
                (item) => item.id !== anime.id
            );
            return newTierList;
        });
    }
    // Modify handleDragStart for sidebar items
    function handleDragStart(anime) {
        setDraggedAnime({
            anime: anime,
            source: 'sidebar'
        })
    }

    // Add new handler for tier items
    function handleTierItemDragStart(anime, e) {
        // Prevent dragging from tiers
        e.preventDefault()
        e.stopPropagation()
    }

    function handleDragOver(e) {
        e.preventDefault()
    }

    function handleDrop(tierIndex) {
        // Only allow drops from sidebar
        if (!draggedAnime.anime || draggedAnime.source !== 'sidebar') return

        setTierList(prevTierList => {
            const newTierList = [...prevTierList]
            // Check if anime already exists in this tier
            const exists = newTierList[tierIndex].animes.some(a => a.id === draggedAnime.anime.id)
            if (!exists) {
                newTierList[tierIndex].animes = [...newTierList[tierIndex].animes, draggedAnime.anime]
            }
            return newTierList
        })

        setDraggedAnime({ anime: null, source: null })
    }

    function generateShareLink() {
        const tierListData = {
            tiers: tierList,
            version: "1.0",
            timestamp: new Date().toISOString()
        };

        // Compress the data
        const compressed = LZString.compressToEncodedURIComponent(
            JSON.stringify(tierListData)
        );

        return `${window.location.origin}${window.location.pathname}?data=${compressed}&tierlistname=${tierListName}`;
    }

    async function handleShare() {
        const url = generateShareLink();
        const TINYURL_TOKEN = import.meta.env.VITE_TINYURL_TOKEN
        const address = "https://api.tinyurl.com/create"
        const options = {
            method: 'POST',
            headers: {
                'Authorization': 'Bearer ' + TINYURL_TOKEN,
                'Content-Type': 'application/json',
                'Accept': 'application/json',
            },
            body: JSON.stringify(
                {
                    "url": url,
                    "domain": "tinyurl.com",
                }
            )
        };

        fetch(address, options).then(async (response) => {
            // const json = await response.json()
            if (response.ok) {
                const json = await response.json()
                const shortenedURL = json.data.tiny_url
                navigator.clipboard.writeText(shortenedURL);
                alert("Shareable link copied to clipboard!");
            } else {
                navigator.clipboard.writeText(url);
                alert("Shareable link copied to clipboard!");
            }
        })


    }

    function saveList() {
        let list = savedLists
        list.push({name: newListName, list: tierList})
        localStorage.setItem("savedlists", JSON.stringify(list))
        localStorage.setItem("tierlistname", JSON.stringify(newListName))
        setSavedLists(list)
        setSaveListModal(false)
        setTierListName(newListName)
        alert("Saved tierlist successfully!")
    }


    useEffect(() => {
        // Check URL for compressed data
        const params = new URLSearchParams(window.location.search);
        const compressedData = params.get('data');
        const name = params.get('tierlistname')

        if (compressedData) {
            try {
            // Decompress and parse
            const jsonString = LZString.decompressFromEncodedURIComponent(compressedData);
            const data = JSON.parse(jsonString);

            // Validate and load
            if (data.tiers && Array.isArray(data.tiers)) {
                setTierList(data.tiers);
                setTierListName(name)
                window.location = 'https://anitier-seven.vercel.app/'
            }
            } catch (error) {
            console.error("Failed to parse tier list data", error);
            }
        }
    }, []);

    useEffect(getAnimesFromSearch, [searchQuery])

    useEffect(() => {
        localStorage.setItem("tierlist", JSON.stringify(tierList))
    }, [tierList])

    useEffect(() => {
        const url = document.location
        const accessToken = String(url).split("#")[String(url).split("#").length - 1].split("&")[0].split("=")
        if (accessToken.length > 1) {
            const token = accessToken[accessToken.length-1]

            const url = "https://graphql.anilist.co"
            const query = `
                query {
                    Viewer {
                        id
                        name
                    }
                }
            `

            const options = {
                method: 'POST',
                headers: {
                    'Authorization': 'Bearer ' + token,
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                },
                body: JSON.stringify({
                    query: query,
                })
            };

            fetch(url, options).then(async (response) => {
                if (response.ok) {
                    const json = await response.json()
                    const id = json.data.Viewer.id
                    const name = json.data.Viewer.name
                    console.log(token, id)
                    localStorage.setItem("auth", JSON.stringify({token: token, id: id, name: name}))
                    window.location = 'https://anitier-seven.vercel.app/'
                }
            })
        }
    }, [])

    const ANILIST_CLIENT_ID = import.meta.env.VITE_ANILIST_ID

    return (
        <main>
            <div className="sidebar">
                <div className="search-container">
                    <div className="center">
                        {
                            auth.token == null ?
                            <a className="anilist-tier-btn" href={`https://anilist.co/api/v2/oauth/authorize?client_id=${ANILIST_CLIENT_ID}&response_type=token`}>
                            <img className="anilist-tier-btn__icon" src="/anilist_logo_transparent.png"/>
                                Login to <span>AniList</span>
                            </a>
                            :
                            <button className="anilist-tier-btn" onClick={() => getUserAnimeList()}>
                            <img className="anilist-tier-btn__icon" src="/anilist_logo_transparent.png"/>
                                Load your <span>Animelist</span>
                            </button>
                        }
                    </div>
                    <div className="search-bar">
                        <input type="text" className="search-input" placeholder="Search anime..."  id="anime-search-query" onKeyDown={triggerSearch}/>
                        <button className="btn search-btn" onClick={() => {setSearchQuery(document.querySelector("#anime-search-query")?.value)}}>
                            <svg className="icon" viewBox="0 0 24 24">
                                <path fill="currentColor" d="M15.5 14h-.79l-.28-.27C15.41 12.59 16 11.11 16 9.5 16 5.91 13.09 3 9.5 3S3 5.91 3 9.5 5.91 16 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z"/>
                            </svg>
                        </button>
                    </div>
                </div>

                <div className="results-container">
                    {
                        animeData.map((anime, index) => (
                            <div className="anime-card" key={index} draggable onDragStart={() => handleDragStart(anime)}>
                                <div
                                    className="anime-cover"
                                    onMouseEnter={() => setHoveredIndex(index)}
                                    onMouseLeave={() => setHoveredIndex(null)}
                                >
                                    <img src={anime.coverImage.large} alt={anime.title.english || anime.title.romaji}/>
                                    {hoveredIndex === index && (
                                        <div className="anime-title modal-overlay card">
                                            {anime.title.english || anime.title.romaji}
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))
                    }
                </div>

                <div className="pagination">
                    {animeData.length != 0 ? <>
                        <button className={`page-btn ${currentPage == 1 ? "disabled" : ""}`} onClick={() => {if (currentPage != 1) {
                            if (animeDataFromSearch) {
                                getAnimesFromSearch(currentPage-1)
                            } else {
                                getUserAnimeList(currentPage-1)
                            }
                        }}}>
                            <svg className="icon" viewBox="0 0 24 24">
                                <path fill="currentColor" d="M15.41 7.41L14 6l-6 6 6 6 1.41-1.41L10.83 12z"/>
                            </svg>
                            Previous
                        </button>
                        <button className={`page-btn ${hasNextPage == false ? "disabled" : ""}`} onClick={() => {if (hasNextPage == true) {
                            if (animeDataFromSearch) {
                                getAnimesFromSearch(currentPage+1)
                            } else {
                                getUserAnimeList(currentPage+1)
                            }
                        }}}>
                            Next
                            <svg className="icon" viewBox="0 0 24 24">
                                <path fill="currentColor" d="M10 6L8.59 7.41 13.17 12l-4.58 4.59L10 18l6-6z"/>
                            </svg>
                        </button>
                    </> : <></>}
                </div>
            </div>
            <div className="tierlist-container">
                <div className="tierlist-header">
                    <div className="tierlist-title">{tierListName}</div>
                    <div className="tier-actions">
                        <button className="btn btn-outline" onClick={() => {setTierList(initialTierList); setTierListName("My Anime Tier List")}}>
                            <svg className="icon" viewBox="0 0 24 24" width="22" height="22">
                                <path fill="currentColor" d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"/>
                            </svg>
                            New List
                        </button>
                        <button className="btn" onClick={() => {setLoadListModal(true)}}>
                            <svg className="icon" viewBox="0 0 24 24">
                                <path fill="currentColor" d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"/>
                            </svg>
                            Load List
                        </button>
                        <button className="btn" onClick={() => setSaveListModal(true)}>
                            <svg className="icon" viewBox="0 0 24 24">
                                <path fill="currentColor" d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"/>
                            </svg>
                            Save List
                        </button>
                        <button className="btn" onClick={() => setShareModal(true)}>
                            <svg className="icon" viewBox="0 0 24 24">
                                <path fill="currentColor" d="M18 16.08c-.76 0-1.44.3-1.96.77L8.91 12.7c.05-.23.09-.46.09-.7s-.04-.47-.09-.7l7.05-4.11c.54.5 1.25.81 2.04.81 1.66 0 3-1.34 3-3s-1.34-3-3-3-3 1.34-3 3c0 .24.04.47.09.7L8.04 9.81C7.5 9.31 6.79 9 6 9c-1.66 0-3 1.34-3 3s1.34 3 3 3c.79 0 1.5-.31 2.04-.81l7.12 4.16c-.05.21-.08.43-.08.65 0 1.61 1.31 2.92 2.92 2.92 1.61 0 2.92-1.31 2.92-2.92s-1.31-2.92-2.92-2.92z"/>
                            </svg>
                            Share
                        </button>
                    </div>
                </div>
                {
                    tierList.map((tier, index) => {
                        return (
                            <div className="tier-row" key={index} onDragOver={handleDragOver} onDrop={() => handleDrop(index)} >
                                <div className="tier-label" style={{"backgroundColor": tier.color}}>{tier.name}</div>
                                <ReactSortable
                                    group="anime-tierlist"
                                    list={tier.animes}
                                    setList={(currentAnimes) => {
                                        setTierList(tiers => tiers.map((t, i) =>
                                            i === index ? { ...t, animes: currentAnimes } : t
                                        ))
                                    }}
                                    className="tier-content"
                                >
                                    {
                                        tier.animes.map((anime) => {
                                            return (
                                                <div className="tier-item" key={anime.id}
                                                    onMouseEnter={() => setTierHoveredIndex(anime.id)}
                                                    onMouseLeave={() => setTierHoveredIndex(null)}
                                                >
                                                    <img className="anime-tier-cover" onClick={(e) => deleteFromTier(index, anime, e)} src={anime.coverImage.large} alt={anime.title.english || anime.title.romaj}  onDragStart={(e) => handleTierItemDragStart(anime, e)}/>
                                                    {tierHoveredIndex === anime.id && (
                                                        <div className="anime-title modal-overlay card" onClick={(e) => deleteFromTier(index, anime, e)}>
                                                            {anime.title.english || anime.title.romaji}
                                                        </div>
                                                    )}
                                                </div>
                                            )
                                        })
                                    }
                                </ReactSortable>
                                <div className="center" style={{"cursor": "pointer"}} onClick={() => deleteTier(index)}>
                                    <img className="icon icon-medium" src="https://img.icons8.com/?size=100&id=7837&format=png&color=FFFFFF"></img>
                                </div>
                            </div>
                        )
                    })
                }

                <div className="add-tier-btn" onClick={() => setModalState(true)}>
                    <svg className="icon" viewBox="0 0 24 24" style={{"marginRight": "6px"}}>
                        <path fill="currentColor" d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"/>
                    </svg>
                    Add New Tier
                </div>
                <div className={`modal-overlay ${modalState ? '' : 'hidden'}`}>
                    <div className="modal">
                        <div className="modal-header">
                            <div className="modal-title">Add New Tier</div>
                            <button className="close-btn" onClick={() => setModalState(false)}>×</button>
                        </div>
                        <div className="form-group">
                            <label forhtml="tier-name">Tier Name</label>
                            <input type="text" id="tier-name" className="form-input" placeholder="E.g., S, A, B, or custom name" onChange={(event) => setNewTierName(event.target.value)}/>
                        </div>
                        <div className="form-group">
                            <label>Tier Color</label>
                            <div className="center">
                                <SwatchesPicker color={newTierColor} onChange={(color) => setNewTierColor(color.hex)}></SwatchesPicker>
                            </div>
                        </div>
                        <div className="modal-footer">
                            <button className="btn btn-outline" onClick={() => setModalState(false)}>Cancel</button>
                            <button className="btn" onClick={addTier}>Add Tier</button>
                        </div>
                    </div>
                </div>
                <div className={`modal-overlay ${shareModal ? '' : 'hidden'}`}>
                    <div className="modal">
                        <div className="modal-header">
                            <div className="modal-title">Sharing Tierlist</div>
                            <button className="close-btn" onClick={() => setShareModal(false)}>×</button>
                        </div>

                        <div className="center">
                            <button className="btn" onClick={() => handleShare()}>Generate Link</button>
                        </div>
                        <div className="modal-footer">
                            <button className="btn btn-outline" onClick={() => setShareModal(false)}>Cancel</button>
                        </div>
                    </div>
                </div>
                <div className={`modal-overlay ${saveListModal ? '' : 'hidden'}`}>
                    <div className="modal">
                        <div className="modal-header">
                            <div className="modal-title">Add New Tier</div>
                            <button className="close-btn" onClick={() => setSaveListModal(false)}>×</button>
                        </div>
                        <div className="form-group">
                            <label forhtml="tier-name">Tierlist Name</label>
                            <input type="text" id="tier-name" className="form-input" onChange={(event) => setNewListName(event.target.value)}/>
                        </div>

                        <div className="modal-footer">
                            <button className="btn btn-outline" onClick={() => setSaveListModal(false)}>Cancel</button>
                            <button className="btn" onClick={saveList}>Save List</button>
                        </div>
                    </div>
                </div>
                <div className={`modal-overlay ${loadListModal ? '' : 'hidden'}`}>
                <div className="modal">
                    <div className="modal-header">
                        <div className="modal-title">Load Saved Tierlist</div>
                        <button className="close-btn" onClick={() => setLoadListModal(false)}>×</button>
                    </div>

                    <div className="form-group">
                        <div className="saved-lists-container">
                            {savedLists.length > 0 ? (
                                savedLists.map((list, index) => (
                                    <div key={index} className="saved-list-item">
                                        <button
                                            className="saved-list-name"
                                            onClick={() => {
                                                setTierList(list.list);
                                                setTierListName(list.name);
                                                setLoadListModal(false);
                                            }}
                                        >
                                            {list.name}
                                        </button>
                                        <button
                                            className="delete-list-btn"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                const updatedLists = savedLists.filter((_, i) => i !== index);
                                                localStorage.setItem('savedTierLists', JSON.stringify(updatedLists));
                                                setSavedLists(updatedLists);
                                            }}
                                        >
                                            ×
                                        </button>
                                    </div>
                                ))
                            ) : (
                                <p className="no-saved-lists">No saved tierlists found</p>
                            )}
                        </div>
                    </div>

                    <div className="modal-footer">
                        <button className="btn btn-outline" onClick={() => setLoadListModal(false)}>Cancel</button>
                    </div>
                </div>
            </div>
            </div>
        </main>
    )
}
