'use server';
import {z} from 'zod';
import { sql } from '@vercel/postgres';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';




const FormSchema = z.object({
    id: z.string(),
    customerId: z.string(),
    amount: z.coerce.number(),
    status: z.enum(['pending', 'paid']),
    date: z.string(),
  });
   
  const CreateInvoice = FormSchema.omit({ id: true, date: true });
  const UpdateInvoice = FormSchema.omit({ id: true, date: true });

  export async function updateInvoice(id: string, formData: FormData) {
    const { customerId, amount, status } = UpdateInvoice.parse({
      customerId: formData.get('customerId'),
      amount: formData.get('amount'),
      status: formData.get('status'),
    });
   
    const amountInCents = amount * 100;
   
    await sql`
      UPDATE invoices
      SET customer_id = ${customerId}, amount = ${amountInCents}, status = ${status}
      WHERE id = ${id}
    `;
   //调用 revalidatePath 以清除客户端缓存并发出新的服务器请求。
   //调用 redirect 将用户重定向到发票页面。
    revalidatePath('/dashboard/invoices');
    redirect('/dashboard/invoices');
  }
  
export async function createInvoice(formData: FormData) {
  const {customerId, amount, status} = CreateInvoice.parse( {
    customerId: formData.get('customerId'),
    amount: formData.get('amount'),
    status: formData.get('status'),

  });
  const amountInCents = amount * 100;
  const date = new Date().toISOString().split('T')[0];
  await sql`
  INSERT INTO invoices (customer_id, amount, status, date)
  VALUES (${customerId}, ${amountInCents}, ${status}, ${date})
`;
  //清楚缓存
  revalidatePath('/dashboard/invoices');
  redirect('/dashboard/invoices');



  
  // Test it out:
//   console.log(rawFormData);
//   console.log(typeof rawFormData.amount);
}


export async function deleteInvoice(id: string) {
  await sql`DELETE FROM invoices WHERE id = ${id}`;
  //由于此 action 是在 /dashboard/invoices 路径中调用的，您不需要调用 redirect。调用 revalidatePath 将触发新的服务器请求并重新渲染表格。
  revalidatePath('/dashboard/invoices');
}