import express from 'express'
import rp from 'request-promise'
import cors from 'cors'

const app = express()

app.use(cors())
app.set('view engine', 'ejs')

const root = 'http://swapi.co/api/'

app.get('/', (req, res) => {
  res.render('index')
})

app.get('/character/:name',
  (req, res) => {
    const url = `${root}people/?search=${req.params.name}`
    rp(url)
      .then((body) => {
        const person = JSON.parse(body).results[0]
        res.render('character', {person})
      })
      .catch((err) => {
        console.log(err)
      })
  }
)

app.get('/characters',
  (req, res) => {
    const sort = req.query.sort

    const urls = [
      `${root}people/`,
      `${root}people/?page=2`,
      `${root}people/?page=3`,
      `${root}people/?page=4`,
      `${root}people/?page=5`
    ]

    const characters = urls.map((url) => {
      return rp(url)
        .then((data) => {
          return JSON.parse(data).results
        })
        .catch((err) => {
          console.log(err)
        })
    })

    const format = (sort) => {
      if (sort === 'unknown') {
        return 0
      }
      return parseInt(sort.replace(/,/g, ''))
    }

    const sortData = (data) => {
      return data.sort((a, b) => {
        if (!sort) {
          return
        } else if (sort === 'name') {
          return (a.name > b.name) - (a.name < b.name)
        } else {
          return format(a[sort]) - format(b[sort])
        }
      })
    }

    Promise.all(characters)
      .then((data) => {
        res.send(sortData([].concat.apply([], data)))
      })
      .catch((err) => {
        console.log(err)
      })
  }
)

app.get('/planetresidents',
  (req, res) => {
    const url = `${root}planets/`
    rp(url)
      .then((data) => {
        const results = JSON.parse(data).results

        const planets = results.map((result) => {
          const residents = result.residents.map((resident) => {
            return rp(resident)
            .then((data) => {
              return JSON.parse(data).name
            })
            .catch((err) => {
              console.log(err)
            })
          })

          return Promise.all(residents)
            .then((data) => {
              return {
                [result.name]: data
              }
            })
        })
        return Promise.all(planets)
      })
      .then((data) => {
        res.send(data)
      })
      .catch((err) => {
        console.log(err)
      })
  }
)

const server = app.listen(8080, () => {
  const host = server.address().address,
    port = server.address().port

  console.log('API listening at http://%s:%s', host, port)
})
