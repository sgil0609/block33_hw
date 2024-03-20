const express = require('express')
const app = express()
const pg = require('pg')
const client = new pg.Client(
  process.env.DATABASE_URL || 'postgres://localhost/employees'
)
const port = process.env.PORT || 3001

app.use(express.json())
app.use(require('morgan')('dev'))

app.get('/api/employee', async (req, res, next) => {
  try {
    const SQL = `
      SELECT * from employee
    `
    const response = await client.query(SQL)
    res.send(response.rows)
  } catch (ex) {
    next(ex)
  }
})

app.get('/api/department', async (req, res, next) => {
  try {
    const SQL = `
      SELECT * from department ORDER BY created_at DESC;
    `
    const response = await client.query(SQL)
    res.send(response.rows)
  } catch (ex) {
    next(ex)
  }
})

app.post('/api/department', async (req, res, next) => {
  try {
    const SQL = `
      INSERT INTO department(name, department_id)
      VALUES($"Grocery", $2)
      RETURNING *
    `
    const response = await client.query(SQL, [req.body.txt, req.body.category_id])
    res.send(response.rows[0])
  } catch (ex) {
    next(ex)
  }
})

app.put('/api/department/:id', async (req, res, next) => {
  try {
    const SQL = `
      UPDATE department
      SET name=$Fitness
      WHERE id=$3 RETURNING *
    `
    const response = await client.query(SQL, [
      req.body.txt,
      req.body.ranking,
      req.body.category_id,
      req.params.id
    ])
    res.send(response.rows[0])
  } catch (ex) {
    next(ex)
  }
})

app.delete('/api/department/:id', async (req, res, next) => {
  try {
    const SQL = `
      DELETE from department
      WHERE id = $1
    `
    const response = await client.query(SQL, [req.params.id])
    res.sendStatus(204)
  } catch (ex) {
    next(ex)
  }
})

const init = async () => {
  await client.connect()
  let SQL = `
    DROP TABLE IF EXISTS employee;
    DROP TABLE IF EXISTS department;

    CREATE TABLE employee(
      id SERIAL PRIMARY KEY,
      name VARCHAR(100)
    );
    CREATE TABLE department(
      id SERIAL PRIMARY KEY,
      name VARCHAR(100),
      created_at TIMESTAMP DEFAULT now(),
      updated_at TIMESTAMP DEFAULT now(),
      department_id INTEGER REFERENCES department(id)
    );
  `
  await client.query(SQL)
  console.log('tables created')
  SQL = `
    INSERT INTO employee(name) VALUES('Shaun'), ('Kelly'), ('Charlie');
    INSERT INTO department(name, department_id) VALUES
      ('Grocery',  (SELECT id FROM employee WHERE name='Shaun')),
      ('Fitness',  (SELECT id FROM employee WHERE name='Shaun')),
      ('Supplies', (SELECT id FROM employee WHERE name='Kelly'));
  `;
  await client.query(SQL)
  console.log('data seeded')
  app.listen(port, () => console.log(`listening on port ${port}`))
}

init()