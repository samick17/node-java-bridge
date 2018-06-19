package com.samick.jarbridge;
import com.samick.jarbridge.instance.*;
import java.lang.reflect.*;
import java.util.List;
import java.util.ArrayList;

public class Main {

	public static String Foo() {
		return "Foo!!";
	}

	public static String[] dumpMethods(String className)
    {
		List<String> list = new ArrayList<String>();
        try {
			Class c = Class.forName(className);
			Method[] methods = c.getDeclaredMethods();
			for(Method method : methods) {
				boolean isStaticMethod = Modifier.isStatic( method.getModifiers());
				Parameter[] params = method.getParameters();
				String methodInfo = method.getName();
				methodInfo += ":"+(isStaticMethod ? "static" : "");
				methodInfo += ":[";
				for(int i = 0; i < params.length; i++) {
					Parameter param = params[i];
					String paramType = param.getParameterizedType().getTypeName();
					methodInfo += paramType;
					if(i < params.length - 1) {
						methodInfo += ",";
					}
				}
				methodInfo += "]";
				list.add(methodInfo);
			}
        } catch (Throwable e) {
			e.printStackTrace();
		}
		String[] strArray = new String[list.size()];
			return list.toArray(strArray);
    }

	public static void main(String[] args) {
		System.out.println(Foo());
		Base b = new Base();
		System.out.println(b.call());
		Concrete c = new Concrete();
		System.out.println(c.call());
		System.out.println("---- Dump base class: com.samick.jarbridge.instance.Base ----");
		String[] methods1 = dumpMethods("com.samick.jarbridge.instance.Base");
		System.out.println(methods1.length);
		for(String mName : methods1) {
			System.out.println(mName);
		}
		System.out.println("---- Dump static class: com.samick.jarbridge.Main ----");
		String[] methods2 = dumpMethods("com.samick.jarbridge.Main");
		System.out.println(methods2.length);
		for(String mName : methods2) {
			System.out.println(mName);
		}
	}
}
