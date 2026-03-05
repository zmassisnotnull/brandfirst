import { Hono } from 'npm:hono';
import { createClient } from 'npm:@supabase/supabase-js@2';

const app = new Hono();

const getSupabase = () => createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
);

// Get all companies (must be before /contacts/:id)
app.get('/contacts/companies', async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    if (!accessToken) {
      return c.json({ error: 'Authentication required' }, 401);
    }

    const supabase = getSupabase();
    const { data: { user }, error: authError } = await supabase.auth.getUser(accessToken);
    
    if (authError || !user) {
      return c.json({ error: 'Authentication failed' }, 401);
    }

    const { data: companies, error } = await supabase
      .from('companies')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    
    return c.json(companies || []);
  } catch (error) {
    console.error('Failed to get companies:', error);
    return c.json({ error: 'Failed to get companies' }, 500);
  }
});

// Get single company
app.get('/contacts/companies/:id', async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    if (!accessToken) {
      return c.json({ error: 'Authentication required' }, 401);
    }

    const supabase = getSupabase();
    const { data: { user }, error: authError } = await supabase.auth.getUser(accessToken);
    
    if (authError || !user) {
      return c.json({ error: 'Authentication failed' }, 401);
    }

    const id = c.req.param('id');
    const { data: company, error } = await supabase
      .from('companies')
      .select('*')
      .eq('id', id)
      .eq('user_id', user.id)
      .single();
    
    if (error || !company) {
      return c.json({ error: 'Company not found' }, 404);
    }
    
    return c.json(company);
  } catch (error) {
    console.error('Failed to get company:', error);
    return c.json({ error: 'Failed to get company' }, 500);
  }
});

// Create company
app.post('/contacts/companies', async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    if (!accessToken) {
      return c.json({ error: 'Authentication required' }, 401);
    }

    const supabase = getSupabase();
    const { data: { user }, error: authError } = await supabase.auth.getUser(accessToken);
    
    if (authError || !user) {
      return c.json({ error: 'Authentication failed' }, 401);
    }

    const body = await c.req.json();
    const { name, logo, brandColor, address, phone, fax, website } = body;
    
    if (!name) {
      return c.json({ error: 'Company name is required' }, 400);
    }
    
    const { data: company, error } = await supabase
      .from('companies')
      .insert({
        user_id: user.id,
        name,
        logo,
        brand_color: brandColor,
        address,
        phone,
        fax,
        website,
        employee_count: 0,
      })
      .select()
      .single();
    
    if (error) throw error;
    
    return c.json(company);
  } catch (error) {
    console.error('Failed to create company:', error);
    return c.json({ error: 'Failed to create company' }, 500);
  }
});

// Update company
app.put('/contacts/companies/:id', async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    if (!accessToken) {
      return c.json({ error: 'Authentication required' }, 401);
    }

    const supabase = getSupabase();
    const { data: { user }, error: authError } = await supabase.auth.getUser(accessToken);
    
    if (authError || !user) {
      return c.json({ error: 'Authentication failed' }, 401);
    }

    const id = c.req.param('id');
    const body = await c.req.json();
    
    // Remove fields that shouldn't be updated
    const { createdAt, updatedAt, user_id, id: bodyId, ...updateData } = body;
    
    const { data: company, error } = await supabase
      .from('companies')
      .update({
        ...updateData,
        brand_color: body.brandColor || updateData.brand_color,
        employee_count: body.employeeCount !== undefined ? body.employeeCount : updateData.employee_count,
      })
      .eq('id', id)
      .eq('user_id', user.id)
      .select()
      .single();
    
    if (error) {
      if (error.code === 'PGRST116') {
        return c.json({ error: 'Company not found' }, 404);
      }
      throw error;
    }
    
    return c.json(company);
  } catch (error) {
    console.error('Failed to update company:', error);
    return c.json({ error: 'Failed to update company' }, 500);
  }
});

// Delete company (only if no contacts)
app.delete('/contacts/companies/:id', async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    if (!accessToken) {
      return c.json({ error: 'Authentication required' }, 401);
    }

    const supabase = getSupabase();
    const { data: { user }, error: authError } = await supabase.auth.getUser(accessToken);
    
    if (authError || !user) {
      return c.json({ error: 'Authentication failed' }, 401);
    }

    const id = c.req.param('id');
    
    // Check if company exists and has contacts
    const { data: company, error: fetchError } = await supabase
      .from('companies')
      .select('employee_count')
      .eq('id', id)
      .eq('user_id', user.id)
      .single();
    
    if (fetchError || !company) {
      return c.json({ error: 'Company not found' }, 404);
    }
    
    if (company.employee_count > 0) {
      return c.json({ error: 'Cannot delete company with existing contacts' }, 400);
    }
    
    const { error } = await supabase
      .from('companies')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id);
    
    if (error) throw error;
    
    return c.json({ success: true });
  } catch (error) {
    console.error('Failed to delete company:', error);
    return c.json({ error: 'Failed to delete company' }, 500);
  }
});

// Get all contacts with company info
app.get('/contacts', async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    if (!accessToken) {
      return c.json({ error: 'Authentication required' }, 401);
    }

    const supabase = getSupabase();
    const { data: { user }, error: authError } = await supabase.auth.getUser(accessToken);
    
    if (authError || !user) {
      return c.json({ error: 'Authentication failed' }, 401);
    }

    // Get contacts with company info via JOIN
    const { data: contacts, error } = await supabase
      .from('contacts')
      .select(`
        *,
        company:companies(*)
      `)
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    
    return c.json(contacts || []);
  } catch (error) {
    console.error('Failed to get contacts:', error);
    return c.json({ error: 'Failed to get contacts' }, 500);
  }
});

// Get single contact
app.get('/contacts/:id', async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    if (!accessToken) {
      return c.json({ error: 'Authentication required' }, 401);
    }

    const supabase = getSupabase();
    const { data: { user }, error: authError } = await supabase.auth.getUser(accessToken);
    
    if (authError || !user) {
      return c.json({ error: 'Authentication failed' }, 401);
    }

    const id = c.req.param('id');
    const { data: contact, error } = await supabase
      .from('contacts')
      .select(`
        *,
        company:companies(*)
      `)
      .eq('id', id)
      .eq('user_id', user.id)
      .single();
    
    if (error || !contact) {
      return c.json({ error: 'Contact not found' }, 404);
    }
    
    return c.json(contact);
  } catch (error) {
    console.error('Failed to get contact:', error);
    return c.json({ error: 'Failed to get contact' }, 500);
  }
});

// Create contact
app.post('/contacts', async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    if (!accessToken) {
      return c.json({ error: 'Authentication required' }, 401);
    }

    const supabase = getSupabase();
    const { data: { user }, error: authError } = await supabase.auth.getUser(accessToken);
    
    if (authError || !user) {
      return c.json({ error: 'Authentication failed' }, 401);
    }

    const body = await c.req.json();
    const { name, position, department, companyId, mobile, phone, fax, email, website, address } = body;
    
    if (!name || !position || !companyId) {
      return c.json({ error: 'Name, position, and companyId are required' }, 400);
    }
    
    const { data: contact, error } = await supabase
      .from('contacts')
      .insert({
        user_id: user.id,
        company_id: companyId,
        name,
        position,
        department,
        mobile,
        phone,
        fax,
        email,
        website,
        address,
      })
      .select()
      .single();
    
    if (error) throw error;
    
    // Update company employee count
    await supabase.rpc('increment', {
      table_name: 'companies',
      row_id: companyId,
      column_name: 'employee_count'
    }).catch(() => {
      // Fallback: manual increment
      supabase
        .from('companies')
        .update({ employee_count: supabase.raw('employee_count + 1') })
        .eq('id', companyId)
        .eq('user_id', user.id)
        .then(() => {});
    });
    
    return c.json(contact);
  } catch (error) {
    console.error('Failed to create contact:', error);
    return c.json({ error: 'Failed to create contact' }, 500);
  }
});

// Update contact
app.put('/contacts/:id', async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    if (!accessToken) {
      return c.json({ error: 'Authentication required' }, 401);
    }

    const supabase = getSupabase();
    const { data: { user }, error: authError } = await supabase.auth.getUser(accessToken);
    
    if (authError || !user) {
      return c.json({ error: 'Authentication failed' }, 401);
    }

    const id = c.req.param('id');
    const body = await c.req.json();
    
    // Remove fields that shouldn't be updated
    const { createdAt, updatedAt, user_id, id: bodyId, ...updateData } = body;
    
    const { data: contact, error } = await supabase
      .from('contacts')
      .update({
        ...updateData,
        company_id: body.companyId || updateData.company_id,
      })
      .eq('id', id)
      .eq('user_id', user.id)
      .select()
      .single();
    
    if (error) {
      if (error.code === 'PGRST116') {
        return c.json({ error: 'Contact not found' }, 404);
      }
      throw error;
    }
    
    return c.json(contact);
  } catch (error) {
    console.error('Failed to update contact:', error);
    return c.json({ error: 'Failed to update contact' }, 500);
  }
});

// Delete contact
app.delete('/contacts/:id', async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    if (!accessToken) {
      return c.json({ error: 'Authentication required' }, 401);
    }

    const supabase = getSupabase();
    const { data: { user }, error: authError } = await supabase.auth.getUser(accessToken);
    
    if (authError || !user) {
      return c.json({ error: 'Authentication failed' }, 401);
    }

    const id = c.req.param('id');
    
    // Get contact to find company_id
    const { data: contact, error: fetchError } = await supabase
      .from('contacts')
      .select('company_id')
      .eq('id', id)
      .eq('user_id', user.id)
      .single();
    
    if (fetchError || !contact) {
      return c.json({ error: 'Contact not found' }, 404);
    }
    
    const { error } = await supabase
      .from('contacts')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id);
    
    if (error) throw error;
    
    // Decrement company employee count
    await supabase
      .from('companies')
      .update({ employee_count: supabase.raw('GREATEST(employee_count - 1, 0)') })
      .eq('id', contact.company_id)
      .eq('user_id', user.id)
      .catch(() => {});
    
    return c.json({ success: true });
  } catch (error) {
    console.error('Failed to delete contact:', error);
    return c.json({ error: 'Failed to delete contact' }, 500);
  }
});

export default app;
