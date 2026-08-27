import { jest } from "@jest/globals";

const findMock = jest.fn();
const findByIdMock = jest.fn();
const saveMock = jest.fn();

const OrderMock = jest.fn(() => ({
  save: saveMock
}));

const UserMock = {
  findById: findByIdMock
};

OrderMock.find = findMock;

jest.unstable_mockModule("../../src/models/Order.js", () => ({
  default: OrderMock
}));

jest.unstable_mockModule("../../src/models/User.js", () => ({
  default: UserMock
}));

const {
  getOrders,
  createOrder
} = await import(
  "../../src/services/orderService.js"
);

describe("OrderService - getOrders", () => {

  beforeEach(() => {
    findMock.mockReset();
  });

  test("debería devolver todas las órdenes", async () => {

    const orders = [
      {
        id: "1",
        total: 500,
        status: "PENDING"
      },
      {
        id: "2",
        total: 1000,
        status: "COMPLETED"
      }
    ];

    findMock.mockResolvedValue(orders);

    const result = await getOrders();

    expect(findMock).toHaveBeenCalled();
    expect(result).toEqual(orders);
  });

});

describe("OrderService - createOrder", () => {

  beforeEach(() => {
    findByIdMock.mockReset();
    saveMock.mockReset();
    OrderMock.mockClear();
  });

  test("debería crear una orden correctamente", async () => {

    const input = {
      total: 750,
      status: "PENDING",
      userId: "user-1"
    };

    const savedOrder = {
      id: "order-1",
      ...input
    };

    findByIdMock.mockResolvedValue({
      id: "user-1",
      name: "Andres"
    });

    saveMock.mockResolvedValue(savedOrder);

    const result = await createOrder(input);

    expect(findByIdMock).toHaveBeenCalledWith("user-1");

    expect(OrderMock).toHaveBeenCalledWith(input);

    expect(saveMock).toHaveBeenCalled();

    expect(result).toEqual(savedOrder);
  });

  test("debería rechazar un total menor o igual a cero", async () => {

    const input = {
      total: -100,
      status: "PENDING",
      userId: "user-1"
    };

    await expect(
      createOrder(input)
    ).rejects.toMatchObject({
      code: "INVALID_ORDER_TOTAL",
      statusCode: 400
    });

    expect(findByIdMock).not.toHaveBeenCalled();
    expect(OrderMock).not.toHaveBeenCalled();
  });

  test("debería rechazar una orden sin userId", async () => {

    const input = {
      total: 500,
      status: "PENDING"
    };

    await expect(
      createOrder(input)
    ).rejects.toMatchObject({
      code: "INVALID_ORDER_USER",
      statusCode: 400
    });

    expect(findByIdMock).not.toHaveBeenCalled();
    expect(OrderMock).not.toHaveBeenCalled();
  });

  test("debería rechazar una orden cuando el usuario no existe", async () => {

    const input = {
      total: 500,
      status: "PENDING",
      userId: "user-999"
    };

    findByIdMock.mockResolvedValue(null);

    await expect(
      createOrder(input)
    ).rejects.toMatchObject({
      code: "USER_NOT_FOUND",
      statusCode: 404
    });

    expect(OrderMock).not.toHaveBeenCalled();
    expect(saveMock).not.toHaveBeenCalled();
  });

  test("debería rechazar un status inválido", async () => {

    const input = {
      total: 500,
      status: "INVALID",
      userId: "user-1"
    };

    findByIdMock.mockResolvedValue({
      id: "user-1",
      name: "Andres"
    });

    await expect(
      createOrder(input)
    ).rejects.toMatchObject({
      code: "INVALID_ORDER_STATUS",
      statusCode: 400
    });

    expect(OrderMock).not.toHaveBeenCalled();
    expect(saveMock).not.toHaveBeenCalled();
  });

});