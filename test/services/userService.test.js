import { jest } from "@jest/globals";

const findMock = jest.fn();
const findByIdMock = jest.fn();
const findOneMock = jest.fn();

const UserMock = {
  find: findMock,
  findById: findByIdMock,
  findOne: findOneMock
};

jest.unstable_mockModule("../../src/models/User.js", () => ({
  default: UserMock
}));

const {
  getUsers,
  getUserById,
  getUserByEmail
} = await import(
  "../../src/services/userService.js"
);

describe("UserService - getUsers", () => {

  beforeEach(() => {
    findMock.mockReset();
  });

  test("debería devolver todos los usuarios", async () => {

    const users = [
      {
        id: "1",
        name: "Andres",
        email: "andres@example.com"
      },
      {
        id: "2",
        name: "Carlos",
        email: "carlos@example.com"
      }
    ];

    findMock.mockResolvedValue(users);

    const result = await getUsers();

    expect(findMock).toHaveBeenCalled();
    expect(result).toEqual(users);
  });

});

describe("UserService - getUserById", () => {

  beforeEach(() => {
    findByIdMock.mockReset();
  });

  test("debería devolver un usuario existente", async () => {

    const user = {
      id: "1",
      name: "Andres",
      email: "andres@example.com"
    };

    findByIdMock.mockResolvedValue(user);

    const result = await getUserById("1");

    expect(findByIdMock).toHaveBeenCalledWith("1");
    expect(result).toEqual(user);
  });

  test("debería lanzar USER_NOT_FOUND si no existe", async () => {

    findByIdMock.mockResolvedValue(null);

    await expect(
      getUserById("999")
    ).rejects.toMatchObject({
      code: "USER_NOT_FOUND",
      statusCode: 404
    });
  });

});

describe("UserService - getUserByEmail", () => {

  beforeEach(() => {
    findOneMock.mockReset();
  });

  test("debería devolver un usuario por email", async () => {

    const user = {
      id: "1",
      name: "Andres",
      email: "andres@example.com"
    };

    findOneMock.mockResolvedValue(user);

    const result = await getUserByEmail(
      "andres@example.com"
    );

    expect(findOneMock).toHaveBeenCalledWith({
      email: "andres@example.com"
    });

    expect(result).toEqual(user);
  });

  test("debería devolver null si el email no existe", async () => {

    findOneMock.mockResolvedValue(null);

    const result = await getUserByEmail(
      "unknown@example.com"
    );

    expect(result).toBeNull();
  });

});