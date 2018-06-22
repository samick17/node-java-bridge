package com.samick.jarbridge;
import java.lang.reflect.Method;
import java.lang.reflect.Modifier;
import java.lang.reflect.Type;
import java.util.ArrayList;
import java.util.List;

public class JarBridge {

	public static String[] dumpMethods(String className)
    {
		List<String> list = new ArrayList<String>();
        try {
			Class<?> c = Class.forName(className);
			Method[] methods = c.getDeclaredMethods();
			for(Method method : methods) {
				boolean isStaticMethod = Modifier.isStatic( method.getModifiers());
				Type[] types = method.getGenericParameterTypes();
				String methodInfo = method.getName();
				methodInfo += ":"+(isStaticMethod ? "static" : "");
				methodInfo += ":[";
				for(int i = 0; i < types.length; i++) {
					Type type = types[i];
					
					String paramType = type.getTypeName();
					methodInfo += paramType;
					if(i < types.length - 1) {
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

}
