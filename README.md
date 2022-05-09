- [Description](#description)
- [Installation](#installation)
- [HTTP methods](#http-methods)
- [Client](#client)
- [Server](#server)
- [Query builidng](#query-builidng)
  - [General](#general)
  - [Request filters](#request-filters)
  - [Response modifiers](#response-modifiers)
  - [Insert and update](#insert-and-update)
  - [Run from terminal](#run-from-terminal)
- [Seeders](#seeders)
  - [Setup](#setup)
  - [Usage](#usage)
  - [Example](#example)



## Description

Lightweight and fast local json database manager

- supports all CRUD operations
- comprehensive querying syntax
- built-in seeder to quickly populate your database up to thousands of records
- a command line tool to run dabase queries from terminal
- 'persist' or 'no_persist' mode if you want to block write operations
- base package comes with no dependencies
- easily extensible, dedicated database modules are under way 


## Installation

````bash

    npm install db-essentials --save

    or

    yarn add db-essentials

````
## HTTP methods


| Method         | Verb          | Description
| -------------- | ------------- | -------------------------------------------------------------------------------- |
| find           | GET           | Returns any number of records (all by default), based on provided filters
| find_one       | GET           | Returns a single record based on provided filters
| count          | GET           | Returns the count of records
| delete_one     | DELETE        | Deletes a record that matches the filters
| delete_many    | DELETE        | Deletes all records that match the filters
| save_one       | POST          | Inserts an object into the database
| save_many      | POST          | Inserts an array of objects into the database
| update_one     | PUT           | Updates the first record that matches the filters 
| update_many    | PUT           | Updates all records that match the filters





## Client

Example with fetch API

```js

// with query parameters

await fetch('somedomain/find/items?_only=price,name,updated_at&_limit=10')

// with body

await fetch('somdedomain/update_one/items', {
    method: 'PUT',
    body: JSON.stringify({

        _id: 12,
        _set: {
            price: 169.99
            
        }

    })
})

```

## Server

To setup your database you must create a connection instance first. It accepts two arguments:

- first one is a configuration object with one mandatory property 'database' which is the path to your database files directory
- pass 'no_persist' or 'persist' as the second argument. It creates a writable or non-writable database instance, 'persist' is a default setting.

Recommended way is to cache a connection for further usage.

```js

const {cachedConnection} = require('db-essentials')

const mode = 'persist'

const conn = await cachedConnection({database: 'somepath}, mode)

```

Alternatively, establish a new connection.

```js

const {resolveConnection} = require('db-essentials)

const mode = 'persist'

const Instance = resolveConnection(mode); // pass a mode argument, 'persist' or 'no_persist', if none, it will run in 'persist' mode

connection = await new Instance({database: 'somepath'}, mode).establishConnection();

```

Each query is represented by an isolated Query instance. Pass a connection instannce to the constructor, see above.
                                                                           |
```js

    const {Query} = require('db-essentials')

    const q = new Query(conn)

```

Depending on your backend environment, you have to access the request url along with the body, if available.

Full example

```js

const {Query, cachedConnection} = require('db-essentials')

const q = new Query(await cachedConnection({database: 'path'}, 'persist'))

// then

const result = await q.run(url, body)


// shorthand



const result = await new Query(await cachedConnection({database: 'path'}, 'persist' )).run(url, body)

```


## Query builidng

### General

Query operators start with underscore to avoid mismatching, in general you should avoid preceding your database field names with _. 

```js

// _exists, _type, _lte, etc...

```

Nested properties can be accessed using dot notation: 

```js

const q = "?field1.nested.value._gte=10"

```

Array values should be comma separated. Example of selecting fields to return:

```js

const q = "?_only=field1,field2,field3,nested.field1,nested.nested.field3" // etc... 

```

Some operators precede the fieldName and some come after: 

```js

 

const q = "?_nor.field=value"

// vs

const q = "?field.someNestedField._in=1,2,3,4"

/*

```

Search params use a regular '?' and '&' syntax. Some operators allow multiple conditions:

```js

const q = "somedomain/find/items?_nor.itemName._in=name1,name2,name3&_nor.someValue._gte=100&optonalField._exists=true"

```

Above example using request body object

```js

const body = JSON.stringify({

    _nor: {
        itemName: {
            _in: ['name1', 'name2', 'name3']
        },
        someValue: {
            _gte: 100
        }
    },
    optionalField: {
        _exists: true
    }

})

// vs. something more complicated

const url = 'somedomain/update_many/items'

/* 
    All items where: 
    - color contains substring 'bl' 
    - pricing.subtotal is lower 250.99
    - some deeply nested array value size is 4
    should update the following fields:
    - color to 'gold',
    - pricing.subtotal to 399.99
    additionaly:
    - sold field should increment by 1
    - dates.updated_at field should receive a current timestamp

*/

const body = JSON.stringify({

    _and: {
        color: {
            _regex: '/^bl/i'
        },
        pricing: {
            subtotal: {
                _lt: 250.99
            }
        },
        nestedFields: {
            deeperFields: {
               someArray: {
                   _array_size: 4
               }
            }
        }
    },
    _set: {
        color: 'gold'
        pricing: {
            subtotal: 399.99
        }
            
        
    },
    _cdate: {
        dates: {
            updated_at: {
                _type: 'timestamp'
            }
        }
    },
    _inc: {
        sold: 1
    }


})


```

### Request filters

These are treated as reserved keywords and you should avoid using them as database table field names.<br>Filters can access deep nested fields, as example: field.nested.nested._exists=true 

Records are indexed by _id field, which holds a numeric value, it's auto generated, and you can treat it as a usual field, example: 

| Param           | Usage                            | Description                                                                                              |
| --------------- | -------------------------------- | -------------------------------------------------------------------------------------------------------- |
| _gt             | field._gt=[any]                  | Greater than target                                                                                      |
| _gte            | field._gte=[any]                 | Equal or greater than target                                                                             |
| _lt             | field._lt=[any]                  | Lower than target                                                                                        |
| _lte            | field._lte=[any]                 | Equal or lower than target                                                                               |
| _in             | field._in=[array]                | Equal to target or one of comma separated target values                                                  |
| _not_in         | field._not_in=[array]            | Different than target or comma separated target values                                                   |
| _equals         | field._equals=[any]              | Equal to target                                                                                         |
| _not_equal      | field._not_equal=[any]           | Different than target                                                                                    |
| _exists         | field._exists=[boolean]          | Checks if the value exists, pass true or false                                                       |
| _type           | field._type=[string]             | Checks if the value is of given type: string, null, date,  ...etc.<br>You can also pass an array of types to evaluate, field._type=null,date                                      |
| _regex          | field._regex=[string]            | Evaluates value based on a regex expression                                                              |
| _array_match    | field._array_match=[any]         | Checks if an array field contains the requested value                                                    |
| _array_all      | field._array_all=[array]         | Checks if an array field contains all requested values                                                   |
| _array_size     | field._array_size=[number]       | Checks if the array field is of specified size                                                           | 
| _and            | _and.field=[any]                 | Filters out records that don't match all conditions : _and.name=someName&_and.value._gt=4                                                                                            | 
| _or             | _or.field=[any]                  | Returns records that match at least one condition : _or.fieldName=value&_or.orOtherField._gt=4                                                           |
| _nor            | _nor.field=[any]                 | Filters out records that match the conditions: _nor.name=book&_nor.price._gt=19.99                                                                                               |
 

### Response modifiers

These are treated as reserved keywords and you should avoid using them as database table field names. 

| Param         | Usage                     | Description                                                                                                                                                     |
| ------------- | ------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| _only         | _only=[array]             | Specifies which fields should be included with the response. Accepts comma separated fields or a single field. Use either this or '_except'                     |
| _except       | _except=[array]           | Specifies which fields not to icnlude with the response. Accepts comma separated fields or a single field. Use either this or '_only'                           |
| _skip         | _skip=[number]            | How many records to skip. Accepts an integer value.                                                                                                             |
| _limit        | _limit=[number]           | Caps results number to a specified integer value.                                                                                                               |
| _sort         | _sort.field=[number]      | Sorts data by a specified field, should be either 1 (ascending order) or -1 (descending order).                                                                 |     
| _slice        | _slice=[array]            | Gets a range of records.                                                                                                                                        |                                                                                                                                          
| _array_slice  | _array_slice.field=[num]  | Specifies how many values to return from an array field.                                                                                                        |


### Insert and update

Operators to be used inside a body object of POST or PUT http requests

| Param         | Usage                         | Description                                                                                                                                                     |
| ------------- | ----------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------- |                                                                                                                                   
| _set          | _set.field=[any]              | Updateds a value to the target value, should be used with http PUT call                                                                                         |
| _inc          | _inc.field=[number]           | Increments a number value by specified positive or negative value.                                                                                              |
| _cdate        | _cdate.field._type=[string]   | Updates a field to a current date or timestamp, _cdate.updated_at._type=date or _cdate.updated_at._type=timestamp.                                              | 
| _save         | _save=[array]                 | Specifies an array of records to be inserted into database                                                                                                      |



### Run from terminal

Run a database query using a built-in command line interface

Include this line in you package json scripts

The path argument point to you local files

```json

    // you can name the command anything you want, in this example it's just query

    {
        "scripts" : {
            // other scripts
            "query" : "db-essentials-query path=./PATH/TO/LOCAL_DATABASE mode=persit
        }
    }


```

A query must be wrapped in quotes

```js

    npm run

    // or

    yarn query "find/users?_only=name,age&_limit=15" true

    // pass true at the end if you want to see the result as a string, otherwise you can leave it

```

## Seeders

You can use a built-in command line script to seed your local database.


### Setup


Add a line to your package.json scripts as shown in the example below.

- first argument is the path to a directory in your app where seeders are stored.
- second argument is the path which points to your local database files directory.
- the third argument tells whether it should persist the data, by default it does


```json

    {
        "scripts" : {
            // other scripts
            "seed": "db-essentials-seed path/to/seeders path/to/database_files persist"
        }
    }



```
### Usage

```js

    // table name is required

    /* 
      count number is optional, defaults to 1 
      if no number is specified it will run a single seed
      if you want to seed a fixed number of data at once, an array of objects, usually that's what you need 
    */

    npm run seed users 77

    npm run seed categories // creates database records from an array of objects returned from the seeder
    
    or

    yarn seed users 77
    
```

### Example

Seeder is just a function that returns an object or array of objects structured after you database model schema. 
Since it would bring an unncessary overhead the package has no built-in fake data generator. There are devoted packages like https://github.com/faker-js/faker you can try. 
Use anything that suits you.

```js

    // products.js

    // your seeder logic

    const getRandomNumber = (min, max) =>
    Math.floor(Math.random() * (max - min + 1) + min);

    const getRandomArrayElement = (arr) =>
    arr[Math.floor(Math.random() * arr.length)];

    const items = [
    "Bag",
    "Battery Pack",
    "Camera",
    "Charger",
    "Cooker",
    "Electric Car",
    "Flash Drive",
    "Fridge",
    "Frying Pan",
    "Headphones",
    "Keyboard",
    "Microphone",
    "Monitor",
    "Mouse",
    "Multitool",
    "Notebok",
    "Phone",
    "Power Bank",
    "Printer",
    "Soundsystem",
    "Speakers",
    "SSD",
    "Tablet",
    "Telescope",
    "TV",
    "Vacuum Cleaner",
    "Wallet",
    "Watch"
    ];

    const adjectives = [
    "Aluminium",
    "Cheap",
    "Elite",
    "Flexible",
    "Gaming",
    "Hybrid",
    "Mega",
    "Mini",
    "Mobile",
    "Modern",
    "Pro",
    "Slim",
    "Smart",
    "Ultra",
    "Universal",
    "Waterproof",
    "Wireless"
    ];

    const brands = [
    "Apple",
    "Dell",
    "Essentials",
    "Hitachi",
    "HP",
    "Huawei",
    "IBM",
    "Ilyama",
    "LG",
    "Microsoft",
    "Nintendo",
    "Philips",
    "Samsung",
    "Sony"
    ];


    // function that returns a seeder object

    module.exports = async () => {

    // as you might await smth here

    return {
        name: `${getRandomArrayElement(brands)} ${getRandomArrayElement(
        adjectives
        )} ${getRandomArrayElement(items)}`,
        published: getRandomArrayElement([true, false]),
        created: new Date().toISOString(),
        in_stock: getRandomNumber(100, 0),
        sold: getRandomNumber(1001, 0),
        price: (getRandomNumber(2001, 1) + getRandomNumber(2001, 1)).toFixed(2)
    };
    };



```

Returning an array of objects in a single seed

```js

    // fetch data from external source or create your own

    module.exports = () => {

    return [
        {   
            name: 'LG Modern Headphones',
            in_stock: 45
        },
        {
            name: 'Samsung Ultra SSD',
            in_stock: 125
            
        },
        {
            name: 'Apple Slim Wallet',
            in_stock: 15

        },
        // ...etc
    ]


    }

```
