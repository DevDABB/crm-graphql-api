import { jest } from "@jest/globals";

const findByIdMock = jest.fn();
const saveMock = jest.fn();
const findByIdAndUpdateMock = jest.fn();
const findByIdAndDeleteMock = jest.fn();

const ProductMock = jest.fn(() => ({
  save: saveMock
}));

ProductMock.findById = findByIdMock;
ProductMock.findByIdAndUpdate = findByIdAndUpdateMock;
ProductMock.findByIdAndDelete = findByIdAndDeleteMock;

jest.unstable_mockModule("../../src/models/Product.js", () => ({
  default: ProductMock
}));

const {
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct
} = await import(
  "../../src/services/productService.js"
);

describe("ProductService - getProductById", () => {

  beforeEach(() => {
    findByIdMock.mockReset();
  });

  test("debería devolver un producto cuando existe", async () => {

    const product = {
      id: "1",
      name: "Laptop",
      price: 2500
    };

    findByIdMock.mockResolvedValue(product);

    const result = await getProductById("1");

    expect(findByIdMock).toHaveBeenCalledWith("1");
    expect(result).toEqual(product);
  });


  test("debería lanzar PRODUCT_NOT_FOUND cuando no existe", async () => {

  findByIdMock.mockResolvedValue(null);

  await expect(
    getProductById("999")
  ).rejects.toMatchObject({
    code: "PRODUCT_NOT_FOUND",
    statusCode: 404
  });

});

});

describe("ProductService - createProduct", () => {

  beforeEach(() => {
    ProductMock.mockClear();
    saveMock.mockReset();
  });

  test("debería crear un producto correctamente", async () => {

    const input = {
      name: "Laptop",
      price: 2500,
      stock: 10,
      categoryId: "1"
    };

    const savedProduct = {
      id: "1",
      ...input
    };

    saveMock.mockResolvedValue(savedProduct);

    const result = await createProduct(input);

    expect(ProductMock).toHaveBeenCalledWith(input);
    expect(saveMock).toHaveBeenCalled();
    expect(result).toEqual(savedProduct);
  });


  test("debería rechazar un nombre vacío", async () => {

  const input = {
    name: "",
    price: 100,
    stock: 10,
    categoryId: "1"
  };

  await expect(
    createProduct(input)
  ).rejects.toMatchObject({
    code: "INVALID_PRODUCT_NAME",
    statusCode: 400
  });

  expect(ProductMock).not.toHaveBeenCalled();
});


test("debería rechazar un precio menor o igual a cero", async () => {

  const input = {
    name: "Laptop",
    price: -100,
    stock: 10,
    categoryId: "1"
  };

  await expect(
    createProduct(input)
  ).rejects.toMatchObject({
    code: "INVALID_PRODUCT_PRICE",
    statusCode: 400
  });

  expect(ProductMock).not.toHaveBeenCalled();
});


test("debería rechazar un stock negativo", async () => {

  const input = {
    name: "Laptop",
    price: 100,
    stock: -5,
    categoryId: "1"
  };

  await expect(
    createProduct(input)
  ).rejects.toMatchObject({
    code: "INVALID_PRODUCT_STOCK",
    statusCode: 400
  });

  expect(ProductMock).not.toHaveBeenCalled();
});

});


describe("ProductService - updateProduct", () => {

  beforeEach(() => {
    findByIdAndUpdateMock.mockReset();
  });

  test("debería actualizar un producto correctamente", async () => {

    const updatedProduct = {
      id: "1",
      name: "Laptop Pro",
      price: 3000,
      stock: 15
    };

    findByIdAndUpdateMock.mockResolvedValue(updatedProduct);

    const result = await updateProduct("1", {
      price: 3000,
      stock: 15
    });

    expect(findByIdAndUpdateMock).toHaveBeenCalledWith(
      "1",
      {
        price: 3000,
        stock: 15
      },
      {
        returnDocument: "after",
        runValidators: true
      }
    );

    expect(result).toEqual(updatedProduct);
  });

  test("debería lanzar PRODUCT_NOT_FOUND si el producto no existe", async () => {

    findByIdAndUpdateMock.mockResolvedValue(null);

    await expect(
      updateProduct("999", {
        price: 500
      })
    ).rejects.toMatchObject({
      code: "PRODUCT_NOT_FOUND",
      statusCode: 404
    });

  });

});


describe("ProductService - deleteProduct", () => {

  beforeEach(() => {
    findByIdAndDeleteMock.mockReset();
  });

  test("debería eliminar un producto correctamente", async () => {

    findByIdAndDeleteMock.mockResolvedValue({
      id: "1",
      name: "Laptop"
    });

    const result = await deleteProduct("1");

    expect(findByIdAndDeleteMock).toHaveBeenCalledWith("1");
    expect(result).toBe(true);
  });

  test("debería lanzar PRODUCT_NOT_FOUND si el producto no existe", async () => {

    findByIdAndDeleteMock.mockResolvedValue(null);

    await expect(
      deleteProduct("999")
    ).rejects.toMatchObject({
      code: "PRODUCT_NOT_FOUND",
      statusCode: 404
    });

  });

});




