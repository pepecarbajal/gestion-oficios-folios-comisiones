import express from 'express'
import { registrarOficio } from '../controllers/oficio.controller.js' // This is just an example, I need to check where login logic is. 
// Wait, index.js had:
// app.get('/login', (req, res) => { res.render('login', { error: null, query: req.query }) })
// app.get('/', (req, res) => { res.render('login', { error: null, query: req.query }) })

const router = express.Router()

router.get('/login', (req, res) => {
  res.render('login', { error: null, query: req.query })
})

router.get('/', (req, res) => {
  res.render('login', { error: null, query: req.query })
})

export default router
