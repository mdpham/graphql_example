const mongooseConnection = require('./mongo')
const mariaConnection = require('./maria')
// Separate database connections from Mongo and Maria
mongooseConnection
  .connect('mongodb://localhost/test', {useNewUrlParser: true})
mariaConnection
  .authenticate()
  .then(() => console.log('MariaDB connected'))

// GraphQL is a single endpoint from a server
const { ApolloServer, gql } = require('apollo-server')

// TYPE DEFINITIONS define the "shape" of your data and specify
// which ways the data can be fetched from the GraphQL server.
const typeDefs = gql`
  # Fairly flexible data types
  scalar Email

  # This defines a node in our data graph
  type User {
    userID: ID
    email: Email
    name: String
  }
  # This node has a field with type 'User'
  #   i.e. definitions are composable
  type Message {
    sentBy: User # This defines an edge in our data graph
    text: String
  }

  # 'Query' type is main definition for GQL
  # Note: multiple field query run in parallel
  #       multiple field mutation run in sequence
  type Query {
    # The query 'messages' expects array of type 'Message'
    messages: [Message]!
    users: [User]!
  }
  # 'Mutation' is similar (but is invoked and not executed immediately)
  type Mutation {
    # 'addUser' will be a function (somewhere) with this signature
    addUser(
      # All fields should be required (i.e. non-null)
      firstName: String!,
      lastName: String!,
      email: String!,
      password: String!
    ): User

    sendMessage(
      sentBy: ID!,
      text: String!
    ): Message
  }
`

// RESOLVERS specify how data is retrieved (multiple DBs, APIs, etc...)
// 
// (parent, variables, context) => someDefinedType
//    parent: the query for which this field is being resolved
//    variables: any arguments passed into query
//    context: an object available globally with every query
const resolvers = {
  // For every type definition there is a resolver...
  Query: {
    messages: async (parent, variables, {Messages}) => {
      const messages = await Messages.findAll({})
      return messages
    },
    users: async (parent, variables, {Users}) => {
      const users = await Users.find({}).lean()
      return users
    }
  },
  Mutation: {
    // These resolvers should do some kind of create/update/delete
    addUser: async (
      parent,
      {firstName, lastName, email, password},
      {Users}
    ) => {
      const newUser = await Users.create({firstName, lastName, email, password})
      return newUser
    },
    sendMessage: async (
      parent,
      {sentBy, text},
      {Messages}
    ) => {
      const message = await Messages.create({sentBy, text})
      return message.dataValues
    }
  },
  // We also resolve subfields on our type definitions
  User: {
    // Concatenate first and last name
    name: async ({firstName, lastName}, variables, context) => {
      return firstName + ' ' + lastName
    }
  },
  Message: {
    // Populate the 'sentBy' field with a 'User' type
    sentBy: async ({sentBy}, variables, {Users}) => {
      const user = await Users.findOne({userID: sentBy})
      return user
    }
  }
}

// GQL server requires type definitions and resolvers for those types
const server = new ApolloServer({
  typeDefs,
  resolvers,
  context: async ({req}) => {
    return {
      // Data models can be provided in context...
      Users: mongooseConnection.model('user'),
      Messages: mariaConnection.models.message,
      // ... or entire database connections
      mongo: mongooseConnection,
      maria: mariaConnection
    }
  }
})

// Launch
server.listen().then(({ url }) => {
  console.log(`🚀  Server ready at ${url}`);
})