const typeDefs = `#graphql

  #Query
  type User {
    id: ID!
    name: String!
    email: String!
    role: UserRole!
  }

  enum UserRole {
    ADMIN
    SELLER
  }

  type Product {
    id: ID!
    name: String!
    price: Float!
    stock: Int!
    category: Category!
  }
  
  type ProductConnection {
    items: [Product!]!
    total: Int!
    page: Int!
    limit: Int!
    totalPages: Int!
    hasNextPage: Boolean!
    hasPreviousPage: Boolean!
  }

  type Category {
    id: ID!
    name: String!
  }

  type Order {
    id: ID!
    total: Float!
    status: OrderStatus!
    user: User!
  }

  type Health {
  status: String!
  timestamp: String!
  uptime: Float!
}

type DependencyChecks {
  mongodb: Boolean!
  redis: Boolean!
}

type Readiness {
  status: String!
  timestamp: String!
  checks: DependencyChecks!
}

  enum ProductSortField {
    NAME
    PRICE
    STOCK
  }

  enum SortOrder {
    ASC
    DESC
  }

  enum OrderStatus {
    PENDING
    COMPLETED
    CANCELLED
  }


  # type Query {
  #   users: [User!]!
  #   user(id: ID!): User
  #   products: [Product!]!
  #   product(id: ID!): Product
  #   orders: [Order!]!
  # }

  type Query {
    me: User
    users: [User!]!
    user(id: ID!): User

    products(
      page: Int = 1
      limit: Int = 10
      categoryId: ID
      minPrice: Float
      maxPrice: Float
      sortBy: ProductSortField = NAME
      sortOrder: SortOrder = ASC
      search: String
    ): ProductConnection!
    product(id: ID!): Product

    categories: [Category!]!
    category(id: ID!): Category
    
    orders: [Order!]!

    health: Health!
    readiness: Readiness!
  }


  #Mutation
  input CreateOrderInput {
    total: Float!
    status: OrderStatus!
    userId: ID!
  }

  input CreateProductInput {
    name: String!
    price: Float!
    stock: Int!
    categoryId: ID!
  }

  input UpdateProductInput {
    name: String
    price: Float
    stock: Int
    categoryId: ID
  }

  type Mutation {
    login(email: String!): String!
    createOrder(input: CreateOrderInput!): Order!
    createProduct(input: CreateProductInput!): Product!
    updateProduct(id: ID!, input: UpdateProductInput!): Product!
    deleteProduct(id: ID!): Boolean!
  }



`;

export default typeDefs;