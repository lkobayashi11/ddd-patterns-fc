import { Sequelize } from "sequelize-typescript";
import Customer from "../../domain/entity/customer";
import Address from "../../domain/entity/address";
import CustomerModel from "../db/sequelize/model/customer.model";
import Order from "../../domain/entity/order";
import OrderItem from "../../domain/entity/order_item";
import Product from "../../domain/entity/product";
import CustomerRepository from "./customer.repository";
import ProductModel from "../db/sequelize/model/product.model";
import ProductRepository from "./product.repository";
import OrderItemModel from "../db/sequelize/model/order-item.model";
import OrderModel from "../db/sequelize/model/order.model";
import OrderRepository from "./order.repository";

describe("Order repository test", () => {
  let sequelize: Sequelize;

  beforeEach(async () => {
    sequelize = new Sequelize({
      dialect: "sqlite",
      storage: ":memory:",
      logging: false,
      sync: { force: true },
    });

    await sequelize.addModels([
      CustomerModel,
      OrderModel,
      OrderItemModel,
      ProductModel,
    ]);
    await sequelize.sync();
  });

  afterEach(async () => {
    await sequelize.close();
  });

  it("should create a new order", async () => {
    const customerRepository = new CustomerRepository();
    const customer = new Customer("123", "Customer 1");
    const address = new Address("Street 1", 1, "Zipcode 1", "City 1");
    customer.changeAddress(address);
    await customerRepository.create(customer);

    const productRepository = new ProductRepository();
    const product = new Product("123", "Product 1", 10);
    await productRepository.create(product);

    const orderItem = new OrderItem(
      "1",
      product.name,
      product.price,
      product.id,
      2
    );

    const order = new Order("123", "123", [orderItem]);

    const orderRepository = new OrderRepository();
    await orderRepository.create(order);

    const orderModel = await OrderModel.findOne({
      where: { id: order.id },
      include: ["items"],
    });

    expect(orderModel.toJSON()).toStrictEqual({
      id: "123",
      customer_id: "123",
      total: order.total(),
      items: [
        {
          id: orderItem.id,
          name: orderItem.name,
          price: orderItem.price,
          quantity: orderItem.quantity,
          order_id: "123",
          product_id: "123",
        },
      ],
    });
  });

    it("should update an order", async () => {
        const customerRepository = new CustomerRepository();
        const address = new Address("Street 1", 1, "Zipcode 1", "City 1");
        const customer = new Customer("1", "Customer 1");
        customer.changeAddress(address);

        await customerRepository.create(customer);

        const productRepository = new ProductRepository();
        const product = new Product("1", "Product 1", 10);
        await productRepository.create(product);

        const orderItem = new OrderItem("1", product.name, product.price, product.id, 2);        
        
        const order = new Order("1", customer.id, [orderItem]);
        const orderRepository = new OrderRepository();
        await orderRepository.create(order);

        const customer2 = new Customer("2", "Customer 2");
        const address2 = new Address("Street 2", 2, "Zipcode 2", "City 2");
        customer2.changeAddress(address2);      

        customerRepository.create(customer2);    

        order.changeCustomer(customer2.id);

        const orderItem2 = new OrderItem("2", product.name, product.price, product.id, 3);
        order.addItem(orderItem2)

        await orderRepository.update(order);

        const orderModel = await OrderModel.findOne({
            where: { id: order.id },
            include: ["items"]
        })

        expect(orderModel.toJSON()).toStrictEqual({
            id: order.id,
            customer_id: customer2.id,
            total: order.total(),
            items: [{
                id: orderItem.id,
                name: orderItem.name,
                price: orderItem.price,
                quantity: orderItem.quantity,
                order_id: order.id,
                product_id: product.id 
            },
            {
                id: orderItem2.id,
                name: orderItem2.name,
                price: orderItem2.price,
                quantity: orderItem2.quantity,
                order_id: order.id,
                product_id: product.id
            }]
         })    
    })

  it("should find an order by id", async () => {
    const customerRepository = new CustomerRepository();
    const address = new Address("Street 1", 1, "Zipcode 1", "City 1");
    const customer = new Customer("1", "Customer 1");
    customer.changeAddress(address);   

    await customerRepository.create(customer);

    const productRepository = new ProductRepository();
    const product = new Product("1", "Product 1", 10);
    await productRepository.create(product);

    const orderItem = new OrderItem("1", product.name, product.price, product.id, 3);
    
    
    const order = new Order("1", customer.id, [orderItem]);
    const orderRepository = new OrderRepository();
    await orderRepository.create(order);

    const orderModel = await OrderModel.findOne({
        where: { id: order.id },
        include: ["items"]
    })

    const orderFound = await orderRepository.find(order.id);

    expect(orderModel.toJSON()).toStrictEqual({
        id: orderFound.id,
        customer_id: customer.id,
        total: orderFound.total(),
        items: [{
            id: orderItem.id,
            name: orderItem.name,
            price: orderItem.price,
            quantity: orderItem.quantity,
            order_id: order.id,
            product_id: product.id
        }]
    });
})


it("should throw an error when trying to find an order by id that does not exist", async () => {
    const orderRepository = new OrderRepository();
    await expect(orderRepository.find("1")).rejects.toThrowError("Order not found");
})

it("should find all orders", async () => {
    const customerRepository = new CustomerRepository();
    const orderRepository = new OrderRepository();
    const productRepository = new ProductRepository();

    const address1 = new Address("Street 1", 1, "Zipcode 1", "City 1");
    const customer1= new Customer("1", "Customer 1");
    customer1.changeAddress(address1);
    await customerRepository.create(customer1);

    const product = new Product("1", "Product 1", 10);
    await productRepository.create(product);

    const orderItem1 = new OrderItem("1", product.name, product.price, product.id, 2);
    const order = new Order("1", customer1.id, [orderItem1]);
    await orderRepository.create(order);

    const address2 = new Address("Street 2", 2, "Zipcode 2", "City 2");
    const customer2= new Customer("2", "Customer 2");
    customer2.changeAddress(address2);
    await customerRepository.create(customer2);

    const product2 = new Product("2", "Product 2", 20);
    await productRepository.create(product2);

    const orderItem2 = new OrderItem("2", product2.name, product2.price, product2.id, 5);
    const order2 = new Order("2", customer2.id, [orderItem2]);
    await orderRepository.create(order2);

    const ordersFound = await orderRepository.findAll()    

    expect(ordersFound).toHaveLength(2);
    expect(ordersFound).toContainEqual(order);
    expect(ordersFound).toContainEqual(order2);

})

});
