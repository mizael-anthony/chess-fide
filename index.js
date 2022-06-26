const express = require('express')
const axios = require('axios')
const cheerio = require('cheerio')
const fs = require('fs')
const cors = require('cors')

const FIDE_URL = "https://ratings.fide.com/a_top_var.php?continent=&country=MAD&rating=&gender=&age1=&age2=&period=&period2="
const PORT = process.env.PORT || 5002
const app = express()

app.use(express.json())
app.use(cors())

/**
 * @returns 1 joueur avec info
 */

app.get('/api.chessgasy.file/:chessplayer_name', (req, res) => {
    let { chessplayer_name } = req.params
    let chessplayer_list = []

    try {
        const file = fs.readFileSync('data/players_list.txt', 'utf-8')

        const lines = file.split(/\r?\n/)

        for (let i = 0; i < lines.length; i++) {
            let line = lines[i]
            if (line.includes(chessplayer_name)) {
                let [id_fide, player] = line.split(/\s{2,}/, 2)
                chessplayer_list.push({
                    id_fide,
                    player
                })
            }

        }

        res.json(chessplayer_list)


    } catch (error) {
        console.log(error);

    }



})

/**
 * @returns 1 jouer avec fide info sans id
 * @param id fide
 */
app.get('/api.chessgasy.fide/:id_fide', (req, res) => {
    let { id_fide } = req.params
    axios.get(`https://fide-ratings-scraper.herokuapp.com/player/${id_fide}/info`)
        .then(response => {
            const chessplayer = {
                'id_fide': id_fide,
                'nom_prenoms': response.data.name,
                'sexe': response.data.sexe,
                'elo_standard': response.data.standard_elo,
                'elo_rapide': response.data.rapid_elo,
                'elo_blitz': response.data.blitz_elo,
            }

            res.json(chessplayer)

        })
        .catch(error => console.log(error))

})



/**
 * @returns 1 joueur avec fide id
 * @param nom du joueur
 */
app.get('/api.chessgasy/:chessplayer_name/:country', (req, res) => {
    let { chessplayer_name } = req.params
    let { country } = req.params
    if (chessplayer_name.length < 3) return res.status(404).json({ "détail": "Veuillez saisir 3 caractères au minimum." })

    let chessplayer_list = []
    let chessplayer_list_id_fide = []
    let chessplayer_list_promise = []


    /**
 * @description Récupérer les profiles et nom prénoms des joueurs (MAD uniquement pour l'instant)
 */
    axios.get(`http://ratings.fide.com/advaction.phtml?idcode=&name=${chessplayer_name}&title=&other_title=&country=${country}&sex=&srating=0&erating=3000&birthday=&radio=name&line=asc`)
        .then(result => {
            const htmlData = result.data
            const $ = cheerio.load(htmlData)

            $('td a.tur', htmlData).each((index, element) => {
                // Obtenir nom et lien vers profile de joueur
                let player_name = $(element).text()
                let profile_link = $(element).attr('href')

                // Extraire l'ID Fide du lien
                let id_fide = profile_link.substring((profile_link.indexOf("=") + 1), (profile_link.length))
                chessplayer_list.push({
                    id_fide,
                    player_name
                })

                /** Promise et sous boucle  */

                // Récupérer tous les id fide des joueurs
                // chessplayer_list_id_fide.push(id_fide)

                // Récupérer tous les promises 
                // chessplayer_list_promise.push(axios.get(`https://fide-ratings-scraper.herokuapp.com/player/${id_fide}/info`))


            })

            // Recupération liste des promises et insertion dans tableau méthode 2
            // chessplayer_list_promise = await Promise.all(chessplayer_list_promise)
            // chessplayer_list_promise.map((chessplayer_info, index_fide) => {

            //     chessplayer_list.push({
            //         'id_fide': chessplayer_list_id_fide[index_fide],
            //         'nom_prenoms': chessplayer_info.data.name,
            //         'sexe': chessplayer_info.data.sexe,
            //         'elo_standard': chessplayer_info.data.standard_elo,
            //         'elo_rapide': chessplayer_info.data.rapid_elo,
            //         'elo_blitz': chessplayer_info.data.blitz_elo,

            //     })

            // })

            if (chessplayer_list.length != 0) {
                res.json(chessplayer_list)
            }
            else {
                res.json({ "détail": "Ce joueur n'existe pas." })
            }


        })
        .catch(error => console.log(error))


})


/**
 * @description Lancement du serveur
 */
app.listen(PORT, (req, res) => {
    console.log(`Server is listenning to port ${PORT}`)

})
