import { ConfigModule, ConfigService } from '@nestjs/config';
import { PaypalPaymentModule } from '@app/paypal-payment.module';
import { Module, OnModuleInit } from '@nestjs/common';
import configurations from '@app/configurations';
import { PaypalPaymentService } from './services';
import { CreatePaypalOrderDto } from './dtos';
import { InjectScandiniaviaPaypal } from './decorators/scandiniavia-paypal.decorator';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      expandVariables: true,
      load: [configurations],
    }),
    PaypalPaymentModule.register({
      clientId: process.env.PAYPAL_CLIENT_ID,
      clientSecret: process.env.PAYPAL_CLIENT_SECRET,
      environment: process.env.PAYPAL_ENVIRONMENT as 'sandbox' | 'live',
    }),
    PaypalPaymentModule.registerAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        return {
          ...configService.get('paypalModuleInterface'),
        };
      },
    }),
  ],
})
// export class AppModule {}
export class AppModule implements OnModuleInit {
  constructor(
    @InjectScandiniaviaPaypal() private paymentService: PaypalPaymentService,
  ) {}
  onModuleInit(): any {
    // const order: CreatePaypalOrderDto = {
    const order = {
      intent: 'CAPTURE',
      purchase_units: [
        {
          items: [
            {
              name: 'Dịch vụ dọn nhà',
              description: 'Dịch vụ dọn nhà Dịch vụ dọn nhà Dịch vụ dọn nhà',
              quantity: '1',
              unit_amount: {
                currency_code: 'USD',
                value: '100.00',
              },
            },
          ],
          amount: {
            currency_code: 'USD',
            value: '100.00',
            breakdown: {
              item_total: {
                currency_code: 'USD',
                value: '100.00',
              },
            },
          },
        },
      ],
      application_context: {
        return_url: 'http://localhost:3000/return',
        cancel_url: 'http://localhost:3000/cancel',
      },
    };
    this.paymentService
      .initiateOrder(order as CreatePaypalOrderDto, {
        Prefer: 'return=representation',
      })
      .then((r) => {
        console.log(r);
        console.log('Refe: ', r.purchase_units[0].reference_id);

        return r;
      })
      .then((r: any) => {
        // console.log('update: ', r);
        return this.paymentService.getOrderDetails(r?.id);
      })
      .then((r) => {
        console.log('r: ', r);
      })
      .catch((e) => {
        console.log(e.nativeError);
      });
  }
}
